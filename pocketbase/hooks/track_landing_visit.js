routerAdd('POST', '/backend/v1/track-visit', (e) => {
  var body = e.requestInfo().body || {}

  try {
    var col = $app.findCollectionByNameOrId('landing_visits')
    var r = new Record(col)
    r.set('utm_source', body.utm_source || '')
    r.set('utm_medium', body.utm_medium || '')
    r.set('utm_campaign', body.utm_campaign || '')
    r.set('origin', body.origin || '')
    r.set('referral_code', body.referral_code || '')
    $app.save(r)

    if (body.utm_campaign) {
      try {
        var camp = $app.findFirstRecordByData('campaigns', 'slug', body.utm_campaign)
        var count = camp.getInt('visit_count') || 0
        camp.set('visit_count', count + 1)
        $app.save(camp)
      } catch (_) {}
    }
  } catch (err) {
    // Silent fail - don't block page load
  }

  return e.json(200, { ok: true })
})
