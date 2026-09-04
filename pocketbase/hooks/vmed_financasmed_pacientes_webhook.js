// ============================================================
// INTEGRAÇÃO V MED BRASIL -> FINANÇASMED (SINCRONIZAÇÃO DE PACIENTES)
// Dispara POST https://financasmed.goskip.app/api/hooks/vmed/pacientes
// quando:
// 1) Um agendamento é criado (onRecordAfterCreateSuccess em 'appointments')
// 2) Um paciente com role 'patient' é criado (onRecordAfterCreateSuccess em 'users')
//
// Regras obrigatórias:
// - Header X-API-Key com $os.getenv('V_MED_API_KEY')
// - try/catch completo com logs no formato '[FinançasMed] ...'
// - Nunca quebrar o fluxo da V MED se o FinançasMed estiver fora do ar
// - Toda lógica inline no corpo do callback (PocketBase JSVM pool scoping)
// - Campos obrigatórios: medico_email, name, phone
// - Campos opcionais: email, cpf, birth_date (YYYY-MM-DD), convenio, notes
// ============================================================

// 1. DISPARO NO AGENDAMENTO (onRecordAfterCreateSuccess de 'appointments')
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const profId = record.getString('professional_id')
    const patientId = record.getString('patient_id')

    if (!profId || !patientId) {
      return e.next()
    }

    var medicoEmail = ''
    try {
      var prof = $app.findRecordById('users', profId)
      medicoEmail = prof.getString('email') || ''
    } catch (err) {
      console.log(
        '[FinançasMed] não foi possível carregar profissional (' + profId + '):',
        String(err),
      )
    }

    if (!medicoEmail) {
      return e.next()
    }

    var patientRecord = null
    try {
      patientRecord = $app.findRecordById('users', patientId)
    } catch (err) {
      console.log(
        '[FinançasMed] não foi possível carregar paciente (' + patientId + '):',
        String(err),
      )
      return e.next()
    }

    var patientName = patientRecord.getString('name') || ''
    var patientPhone = patientRecord.getString('phone') || ''
    var patientEmail = patientRecord.getString('email') || ''
    var patientCpf =
      patientRecord.getString('document_id') || patientRecord.getString('tax_id') || ''

    var birthDate = ''
    try {
      var rawDob = patientRecord.getString('date_of_birth')
      if (rawDob && rawDob.length >= 10) {
        birthDate = rawDob.slice(0, 10)
      }
    } catch (_) {}

    var convenio = ''
    var insPartnerId = record.getString('insurance_partner_id')
    if (insPartnerId) {
      try {
        var partner = $app.findRecordById('insurance_partners', insPartnerId)
        convenio = partner.getString('name') || ''
      } catch (_) {}
    }

    var notes = record.getString('notes') || 'Agendamento criado via V MED BRASIL'

    // Envio para o FinançasMed
    try {
      const apiKey = $os.getenv('V_MED_API_KEY') || ''
      if (!apiKey) {
        console.log(
          '[FinançasMed] V_MED_API_KEY não configurada — envio de paciente ignorado (appointment_create)',
        )
      } else if (!patientName) {
        console.log('[FinançasMed] paciente sem nome — envio ignorado (appointment_create)')
      } else {
        var phone = patientPhone || '(00) 00000-0000'
        var bodyData = {
          medico_email: medicoEmail,
          name: patientName,
          phone: phone,
        }
        if (patientEmail) bodyData.email = patientEmail
        if (patientCpf) bodyData.cpf = patientCpf
        if (birthDate) bodyData.birth_date = birthDate
        if (convenio) bodyData.convenio = convenio
        if (notes) bodyData.notes = notes

        var res = $http.send({
          method: 'POST',
          url: 'https://financasmed.goskip.app/api/hooks/vmed/pacientes',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
          timeout: 10,
        })

        console.log(
          '[FinançasMed] [appointment_create] status ' +
            res.statusCode +
            ' | médico: ' +
            medicoEmail +
            ' | paciente: ' +
            patientName +
            ' | tel: ' +
            phone,
        )
      }
    } catch (sendErr) {
      console.log(
        '[FinançasMed] [appointment_create] erro ao disparar webhook de paciente:',
        String(sendErr),
      )
    }
  } catch (err) {
    console.log('[FinançasMed] falha geral no hook de agendamento:', String(err))
  }

  return e.next()
}, 'appointments')

// 2. DISPARO NO CADASTRO DIRETO DE PACIENTE (onRecordAfterCreateSuccess de 'users')
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const role = record.getString('role')

    // Só atua se o novo usuário for paciente
    if (role !== 'patient') {
      return e.next()
    }

    // Identifica se há um médico responsável associado:
    // a) parent_id apontando para um professional
    // b) ou referred_by apontando para um professional
    var medicoEmail = ''

    var parentId = record.getString('parent_id')
    if (parentId) {
      try {
        var parentUser = $app.findRecordById('users', parentId)
        if (parentUser.getString('role') === 'professional') {
          medicoEmail = parentUser.getString('email') || ''
        }
      } catch (_) {}
    }

    if (!medicoEmail) {
      var referredById = record.getString('referred_by')
      if (referredById) {
        try {
          var refUser = $app.findRecordById('users', referredById)
          if (refUser.getString('role') === 'professional') {
            medicoEmail = refUser.getString('email') || ''
          }
        } catch (_) {}
      }
    }

    // Se não encontrou médico vinculado direto no cadastro avulso do paciente,
    // o paciente será sincronizado quando houver um agendamento com um médico.
    if (!medicoEmail) {
      return e.next()
    }

    var patientName = record.getString('name') || ''
    var patientPhone = record.getString('phone') || ''
    var patientEmail = record.getString('email') || ''
    var patientCpf = record.getString('document_id') || record.getString('tax_id') || ''

    var birthDate = ''
    try {
      var rawDob = record.getString('date_of_birth')
      if (rawDob && rawDob.length >= 10) {
        birthDate = rawDob.slice(0, 10)
      }
    } catch (_) {}

    // Envio para o FinançasMed
    try {
      const apiKey = $os.getenv('V_MED_API_KEY') || ''
      if (!apiKey) {
        console.log(
          '[FinançasMed] V_MED_API_KEY não configurada — envio de paciente ignorado (patient_create)',
        )
      } else if (!patientName) {
        console.log('[FinançasMed] paciente sem nome — envio ignorado (patient_create)')
      } else {
        var phone = patientPhone || '(00) 00000-0000'
        var bodyData = {
          medico_email: medicoEmail,
          name: patientName,
          phone: phone,
          notes: 'Paciente cadastrado via plataforma V MED BRASIL',
        }
        if (patientEmail) bodyData.email = patientEmail
        if (patientCpf) bodyData.cpf = patientCpf
        if (birthDate) bodyData.birth_date = birthDate

        var res = $http.send({
          method: 'POST',
          url: 'https://financasmed.goskip.app/api/hooks/vmed/pacientes',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
          timeout: 10,
        })

        console.log(
          '[FinançasMed] [patient_create] status ' +
            res.statusCode +
            ' | médico: ' +
            medicoEmail +
            ' | paciente: ' +
            patientName +
            ' | tel: ' +
            phone,
        )
      }
    } catch (sendErr) {
      console.log(
        '[FinançasMed] [patient_create] erro ao disparar webhook de paciente:',
        String(sendErr),
      )
    }
  } catch (err) {
    console.log('[FinançasMed] falha geral no hook de novo paciente:', String(err))
  }

  return e.next()
}, 'users')
