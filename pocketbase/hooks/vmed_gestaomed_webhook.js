// ============================================================
// INTEGRAÇÃO V MED BRASIL -> GESTÃOMED
// Dispara os dados da consulta finalizada para o app financeiro
// do médico (GestãoMed). Nunca quebra o fluxo da V MED se o
// GestãoMed estiver offline.
// ============================================================

onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = e.original

  // Só dispara quando o status muda para "completed"
  if (record.getString('status') !== 'completed' || original.getString('status') === 'completed') {
    return e.next()
  }

  try {
    const apiKey = $os.getenv('V_MED_API_KEY') || ''

    if (!apiKey) {
      console.log('[GestãoMed] V_MED_API_KEY não configurada — webhook ignorado.')
      return e.next()
    }

    // ---- Expande professional_id -> email do médico ----
    let medico_email = ''
    try {
      const profId = record.getString('professional_id')
      if (profId) {
        const prof = $app.findRecordById('users', profId)
        medico_email = prof.getString('email')
      }
    } catch (err) {
      console.log('[GestãoMed] não foi possível expandir professional_id:', String(err))
    }

    // ---- Expande patient_id -> nome do paciente ----
    let paciente_nome = ''
    try {
      const patientId = record.getString('patient_id')
      if (patientId) {
        const patient = $app.findRecordById('users', patientId)
        paciente_nome = patient.getString('name')
      }
    } catch (err) {
      console.log('[GestãoMed] não foi possível expandir patient_id:', String(err))
    }

    // ---- Expande insurance_partner_id -> nome do convênio (se houver) ----
    let convenio_nome = null
    try {
      const partnerId = record.getString('insurance_partner_id')
      if (partnerId) {
        const partner = $app.findRecordById('insurance_partners', partnerId)
        convenio_nome = partner.getString('name')
      }
    } catch (err) {
      // sem convênio — ok, mantém null
    }

    // ---- Mapeia classification -> tipo do GestãoMed ----
    const classification = record.getString('classification')
    var tipoMap = {
      first_visit: 'consulta',
      follow_up: 'consulta',
      emergency: 'consulta',
      telemedicine: 'telemedicina',
      exam: 'consulta',
    }
    var tipo = tipoMap[classification] || 'consulta'

    // ---- Data no formato YYYY-MM-DD ----
    var dataStr = ''
    try {
      var raw = record.getString('dateTime')
      if (raw && raw.length >= 10) dataStr = raw.slice(0, 10)
    } catch (err) {
      dataStr = ''
    }

    var payload = {
      medico_email: medico_email,
      valor: record.get('valor') || 0,
      tipo: tipo,
      forma_pagamento: record.getString('forma_pagamento') || '',
      data: dataStr,
      status_pagamento: record.getString('status_pagamento') || '',
      paciente: paciente_nome || '',
      convenio_nome: convenio_nome,
      repasse_pct: record.get('repasse_pct') || null,
    }

    var res = $http.send({
      method: 'POST',
      url: 'https://gestaomed.goskip.app/api/hooks/vmed/consulta',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 10,
    })

    console.log(
      '[GestãoMed] status ' +
        res.statusCode +
        ' | médico: ' +
        medico_email +
        ' | valor: R$ ' +
        payload.valor,
    )
  } catch (err) {
    // Não quebra o fluxo da V MED se o GestãoMed estiver fora
    console.log('[GestãoMed] erro ao disparar webhook:', String(err))
  }

  return e.next()
}, 'appointments')
