routerAdd(
  'POST',
  '/backend/v1/notifications/send',
  (e) => {
    var body = e.requestInfo().body || {}
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var templateSlug = body.template_slug || ''
    var recipientId = body.recipient_id || ''

    if (!templateSlug || !recipientId)
      return e.badRequestError('template_slug and recipient_id are required')

    var template = null
    try {
      template = $app.findFirstRecordByFilter(
        'notification_templates',
        "slug = '" + templateSlug + "' && is_active = true",
      )
    } catch (_) {
      return e.notFoundError('template not found')
    }

    var recipient = null
    try {
      recipient = $app.findRecordById('users', recipientId)
    } catch (_) {
      return e.notFoundError('recipient not found')
    }

    var variables = body.variables || {}
    var name = recipient.getString('name') || 'Profissional'
    var specialty = recipient.getString('specialty') || 'Não informada'

    var subject = template.getString('subject') || ''
    var content = template.getString('body_text') || ''

    subject = subject
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{specialty\}\}/g, specialty)
      .replace(/\{\{status\}\}/g, variables.status || '')
    content = content
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{specialty\}\}/g, specialty)
      .replace(/\{\{status\}\}/g, variables.status || '')

    var keys = Object.keys(variables)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var pattern = new RegExp('\\{\\{' + key + '\\}\\}', 'g')
      subject = subject.replace(pattern, String(variables[key]))
      content = content.replace(pattern, String(variables[key]))
    }

    var templateType = template.getString('type')
    var messageType = 'email'
    if (templateType === 'whatsapp') {
      messageType = 'whatsapp'
    } else if (templateType === 'both') {
      var notifyEmail = recipient.getBool('notify_email')
      messageType = notifyEmail !== false ? 'email' : 'whatsapp'
    }

    var logsCol = $app.findCollectionByNameOrId('notification_logs')
    var log = new Record(logsCol)
    log.set('recipient_id', recipientId)
    log.set('template_slug', templateSlug)
    log.set('message_type', messageType)
    log.set('subject', subject)
    log.set('content', content)
    log.set('status', 'sent')
    log.set('priority', body.priority || 'normal')
    log.set('retry_count', 0)
    $app.save(log)

    try {
      var msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', userId)
      msg.set('receiver_id', recipientId)
      msg.set('content', subject ? subject + '\n\n' + content : content)
      msg.set('is_read', false)
      msg.set('message_type', 'text')
      $app.saveNoValidate(msg)
    } catch (err) {
      $app.logger().error('failed to create in-app message for notification', 'error', err.message)
    }

    return e.json(200, { id: log.id, status: 'sent', message: 'Notification sent successfully' })
  },
  $apis.requireAuth(),
)
