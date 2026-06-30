onRecordAfterCreateSuccess((e) => {
  var webhookUrl = $secrets.get('WELCOME_WEBHOOK_URL') || ''
  if (!webhookUrl) return e.next()

  var name = e.record.getString('name')
  var phone = e.record.getString('phone')
  var email = e.record.getString('email')

  try {
    $http.send({
      url: webhookUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'welcome', name: name, phone: phone, email: email }),
      timeout: 10,
    })
  } catch (err) {
    $app.logger().error('welcome webhook failed', 'error', err.message)
  }

  return e.next()
}, 'users')
