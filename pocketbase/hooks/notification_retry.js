routerAdd(
  'POST',
  '/backend/v1/notifications/{id}/retry',
  (e) => {
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var id = e.request.pathValue('id')
    if (!id) return e.badRequestError('notification id is required')

    var log = null
    try {
      log = $app.findRecordById('notification_logs', id)
    } catch (_) {
      return e.notFoundError('notification not found')
    }

    var retryCount = log.getInt('retry_count') || 0
    log.set('status', 'sent')
    log.set('retry_count', retryCount + 1)
    log.set('error_message', '')
    $app.save(log)

    var recipientId = log.get('recipient_id')
    var content = log.getString('content')
    var subject = log.getString('subject')

    try {
      var msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', userId)
      msg.set('receiver_id', recipientId)
      msg.set('content', subject ? subject + '\n\n' + content : content)
      msg.set('is_read', false)
      msg.set('message_type', 'text')
      $app.saveNoValidate(msg)
    } catch (err) {
      $app.logger().error('failed to create retry in-app message', 'error', err.message)
    }

    return e.json(200, { id: log.id, status: 'sent', message: 'Notification retried successfully' })
  },
  $apis.requireAuth(),
)
