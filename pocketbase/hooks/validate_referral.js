routerAdd('GET', '/backend/v1/validate-referral/{code}', (e) => {
  var code = e.request.pathValue('code')
  if (!code) return e.badRequestError('missing code')

  try {
    var referrer = $app.findFirstRecordByData('users', 'referral_code', code.toUpperCase())
    return e.json(200, {
      valid: true,
      referrer_id: referrer.id,
      referrer_name: referrer.getString('name'),
    })
  } catch (_) {
    return e.json(200, { valid: false })
  }
})
