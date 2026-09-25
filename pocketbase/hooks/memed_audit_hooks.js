// ==============================================================================
// HOOKS DE AUDITORIA: MEMED & PRESCRIÇÕES DIGITAIS
// Registra em audit_logs:
// 1) Conexão, desconexão ou alteração de status da integração Memed do médico
// 2) Assinatura de prescrições médicas (criação direta assinada ou atualização para assinada)
//
// Padrão de resiliência V MED:
// - try/catch completo: falhas de log de auditoria NUNCA quebram a requisição do usuário
// - RBAC e conformidade CFM/LGPD
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. Auditoria de Memed Integrations: Criação inicial
// ------------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const doctorId = record.getString('doctor_id')
    const status = record.getString('connection_status')
    const memedAccountId = record.getString('memed_account_id')

    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)

    let performedBy = doctorId
    if (e.auth && e.auth.id) {
      performedBy = e.auth.id
    }

    log.set('user_id', performedBy)
    log.set('action', 'create')
    log.set('resource_type', 'memed_integration')
    log.set('resource_id', record.getId())
    log.set(
      'details',
      JSON.stringify({
        event: 'memed_integration_created',
        doctor_id: doctorId,
        connection_status: status,
        memed_account_id: memedAccountId,
        connected_at: record.getString('connected_at'),
        timestamp: new Date().toISOString(),
      }),
    )
    $app.save(log)
  } catch (err) {
    $app
      .logger()
      .warn(
        '[Memed Audit] Erro ao gravar audit log de criação:',
        err && err.message ? err.message : String(err),
      )
  }

  return e.next()
}, 'memed_integrations')

// ------------------------------------------------------------------------------
// 2. Auditoria de Memed Integrations: Atualização de Status (Conexão / Desconexão)
// ------------------------------------------------------------------------------
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const original = e.record.original ? e.record.original() : e.original || null

    const newStatus = record.getString('connection_status')
    const oldStatus = original ? original.getString('connection_status') : ''

    // Se o status de conexão mudou, gera log detalhado
    if (newStatus !== oldStatus) {
      const doctorId = record.getString('doctor_id')
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)

      let performedBy = doctorId
      if (e.auth && e.auth.id) {
        performedBy = e.auth.id
      }

      let eventType = 'memed_status_changed'
      if (newStatus === 'conectado') {
        eventType = 'memed_connected'
      } else if (newStatus === 'desconectado') {
        eventType = 'memed_disconnected'
      } else if (newStatus === 'erro') {
        eventType = 'memed_connection_error'
      }

      log.set('user_id', performedBy)
      log.set('action', 'update')
      log.set('resource_type', 'memed_integration')
      log.set('resource_id', record.getId())
      log.set(
        'details',
        JSON.stringify({
          event: eventType,
          doctor_id: doctorId,
          previous_status: oldStatus,
          new_status: newStatus,
          memed_account_id: record.getString('memed_account_id'),
          last_sync: record.getString('last_sync'),
          timestamp: new Date().toISOString(),
        }),
      )
      $app.save(log)
    }
  } catch (err) {
    $app
      .logger()
      .warn(
        '[Memed Audit] Erro ao gravar audit log de alteração:',
        err && err.message ? err.message : String(err),
      )
  }

  return e.next()
}, 'memed_integrations')

// ------------------------------------------------------------------------------
// 3. Auditoria de Prescrições: Criação com status 'assinada'
// ------------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const status = record.getString('status')

    if (status === 'assinada') {
      const professionalId = record.getString('professional_id')
      const patientId = record.getString('patient_id')
      const memedPxId = record.getString('memed_prescription_id')
      const validationUrl = record.getString('document_validation_url')
      const pxType = record.getString('prescription_type') || 'simples'
      const signedAt = record.getString('signed_at') || new Date().toISOString()

      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)

      let performedBy = professionalId
      if (e.auth && e.auth.id) {
        performedBy = e.auth.id
      }

      log.set('user_id', performedBy)
      log.set('action', 'create')
      log.set('resource_type', 'prescription')
      log.set('resource_id', record.getId())
      log.set(
        'details',
        JSON.stringify({
          event: 'prescription_signed',
          professional_id: professionalId,
          patient_id: patientId,
          prescription_type: pxType,
          memed_prescription_id: memedPxId,
          document_validation_url: validationUrl,
          signed_at: signedAt,
          timestamp: new Date().toISOString(),
        }),
      )
      $app.save(log)
    }
  } catch (err) {
    $app
      .logger()
      .warn(
        '[Memed Audit] Erro ao gravar audit log de prescrição assinada (create):',
        err && err.message ? err.message : String(err),
      )
  }

  return e.next()
}, 'prescriptions')

// ------------------------------------------------------------------------------
// 4. Auditoria de Prescrições: Atualização para status 'assinada'
// ------------------------------------------------------------------------------
onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const original = e.record.original ? e.record.original() : e.original || null

    const newStatus = record.getString('status')
    const oldStatus = original ? original.getString('status') : ''

    // Se a prescrição acabou de ser assinada
    if (newStatus === 'assinada' && oldStatus !== 'assinada') {
      const professionalId = record.getString('professional_id')
      const patientId = record.getString('patient_id')
      const memedPxId = record.getString('memed_prescription_id')
      const validationUrl = record.getString('document_validation_url')
      const pxType = record.getString('prescription_type') || 'simples'
      const signedAt = record.getString('signed_at') || new Date().toISOString()

      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)

      let performedBy = professionalId
      if (e.auth && e.auth.id) {
        performedBy = e.auth.id
      }

      log.set('user_id', performedBy)
      log.set('action', 'update')
      log.set('resource_type', 'prescription')
      log.set('resource_id', record.getId())
      log.set(
        'details',
        JSON.stringify({
          event: 'prescription_signed',
          professional_id: professionalId,
          patient_id: patientId,
          prescription_type: pxType,
          memed_prescription_id: memedPxId,
          document_validation_url: validationUrl,
          signed_at: signedAt,
          previous_status: oldStatus,
          timestamp: new Date().toISOString(),
        }),
      )
      $app.save(log)
    }
  } catch (err) {
    $app
      .logger()
      .warn(
        '[Memed Audit] Erro ao gravar audit log de prescrição assinada (update):',
        err && err.message ? err.message : String(err),
      )
  }

  return e.next()
}, 'prescriptions')
