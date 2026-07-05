onRecordAfterUpdateSuccess((e) => {
  var record = e.record
  if (record.getString('role') !== 'professional') return e.next()

  var oldStatus = e.record.original().getString('registration_status')
  var newStatus = record.getString('registration_status')

  if (oldStatus !== newStatus && (newStatus === 'approved' || newStatus === 'rejected')) {
    var slug = 'professional_registration_' + newStatus
    var name = record.getString('name') || 'Profissional'
    var specialty = record.getString('specialty') || 'Não informada'

    var subject = ''
    var content = ''

    try {
      var template = $app.findFirstRecordByFilter(
        'notification_templates',
        "slug = '" + slug + "' && is_active = true",
      )
      subject = template.getString('subject') || ''
      content = template.getString('body_text') || ''
      subject = subject
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{specialty\}\}/g, specialty)
        .replace(/\{\{status\}\}/g, newStatus)
      content = content
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{specialty\}\}/g, specialty)
        .replace(/\{\{status\}\}/g, newStatus)
    } catch (_) {
      subject =
        newStatus === 'approved'
          ? 'Cadastro Aprovado - V MED Brasil'
          : 'Atualização de Cadastro - V MED Brasil'
      content =
        'Olá ' +
        name +
        ', seu cadastro como profissional foi ' +
        newStatus +
        '. Especialidade: ' +
        specialty +
        '.'
    }

    try {
      var logsCol = $app.findCollectionByNameOrId('notification_logs')
      var log = new Record(logsCol)
      log.set('recipient_id', record.id)
      log.set('template_slug', slug)
      log.set('message_type', 'email')
      log.set('subject', subject)
      log.set('content', content)
      log.set('status', 'sent')
      log.set('priority', 'high')
      log.set('retry_count', 0)
      $app.save(log)
    } catch (err) {
      $app.logger().error('failed to create notification log', 'error', err.message)
    }

    try {
      var msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', record.id)
      msg.set('receiver_id', record.id)
      msg.set('content', subject + '\n\n' + content)
      msg.set('is_read', false)
      msg.set('message_type', 'text')
      $app.saveNoValidate(msg)
    } catch (err) {
      $app.logger().error('failed to create in-app message', 'error', err.message)
    }
  }

  var oldVerified = e.record.original().getBool('is_verified')
  var newVerified = record.getBool('is_verified')

  if (oldVerified && !newVerified) {
    var crmSlug = 'crm_verification_failed'
    var profName = record.getString('name') || 'Profissional'
    var crmNumber = record.getString('crm_number') || 'Não informado'

    var crmSubject = 'Verificação de CRM - Documentação Necessária'
    var crmContent =
      'Olá ' +
      profName +
      ', sua verificação de CRM (nº ' +
      crmNumber +
      ') falhou. Por favor, envie a documentação atualizada para reativação do seu perfil.'

    try {
      var crmTemplate = $app.findFirstRecordByFilter(
        'notification_templates',
        "slug = '" + crmSlug + "' && is_active = true",
      )
      crmSubject = crmTemplate.getString('subject') || crmSubject
      crmContent = crmTemplate.getString('body_text') || crmContent
      crmSubject = crmSubject.replace(/\{\{name\}\}/g, profName).replace(/\{\{crm\}\}/g, crmNumber)
      crmContent = crmContent.replace(/\{\{name\}\}/g, profName).replace(/\{\{crm\}\}/g, crmNumber)
    } catch (_) {}

    try {
      var logsCol2 = $app.findCollectionByNameOrId('notification_logs')
      var log2 = new Record(logsCol2)
      log2.set('recipient_id', record.id)
      log2.set('template_slug', crmSlug)
      log2.set('message_type', 'email')
      log2.set('subject', crmSubject)
      log2.set('content', crmContent)
      log2.set('status', 'sent')
      log2.set('priority', 'critical')
      log2.set('retry_count', 0)
      $app.save(log2)
    } catch (err) {
      $app.logger().error('failed to create CRM notification log', 'error', err.message)
    }

    try {
      var msg2 = new Record($app.findCollectionByNameOrId('messages'))
      msg2.set('sender_id', record.id)
      msg2.set('receiver_id', record.id)
      msg2.set('content', crmSubject + '\n\n' + crmContent)
      msg2.set('is_read', false)
      msg2.set('message_type', 'text')
      $app.saveNoValidate(msg2)
    } catch (err) {
      $app.logger().error('failed to create CRM in-app message', 'error', err.message)
    }
  }

  return e.next()
}, 'users')
