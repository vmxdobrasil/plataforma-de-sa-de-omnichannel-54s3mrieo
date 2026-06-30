onRecordAfterCreateSuccess((e) => {
  var record = e.record
  if (record.getString('referral_code')) return e.next()

  var code = $security.randomString(8).toUpperCase()
  var userRecord = $app.findRecordById('users', record.id)
  userRecord.set('referral_code', code)

  if (record.getString('origin_type') === 'b2c') {
    var pts = record.getInt('loyalty_points') || 0
    userRecord.set('loyalty_points', pts + 50)
    $app.save(userRecord)

    var histCol = $app.findCollectionByNameOrId('loyalty_points_history')
    var hist = new Record(histCol)
    hist.set('user_id', record.id)
    hist.set('points_delta', 50)
    hist.set('reason', 'signup')
    $app.save(hist)

    var utmCampaign = record.getString('utm_campaign')
    if (utmCampaign) {
      try {
        var camp = $app.findFirstRecordByData('campaigns', 'slug', utmCampaign)
        var regCount = camp.getInt('registration_count') || 0
        camp.set('registration_count', regCount + 1)
        $app.save(camp)
      } catch (_) {}
    }
  } else {
    $app.save(userRecord)
  }

  return e.next()
}, 'users')
