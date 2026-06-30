onRecordAfterUpdateSuccess((e) => {
  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')
  if (newStatus !== 'completed' || oldStatus === 'completed') return e.next()

  var patientId = e.record.getString('patient_id')
  if (!patientId) return e.next()

  try {
    var patient = $app.findRecordById('users', patientId)
    var referrerId = patient.getString('referred_by')
    if (!referrerId) return e.next()

    var POINTS = 100
    var referrer = $app.findRecordById('users', referrerId)
    var pts = referrer.getInt('loyalty_points') || 0
    referrer.set('loyalty_points', pts + POINTS)
    $app.save(referrer)

    var histCol = $app.findCollectionByNameOrId('loyalty_points_history')
    var hist = new Record(histCol)
    hist.set('user_id', referrerId)
    hist.set('points_delta', POINTS)
    hist.set('reason', 'referral')
    hist.set('related_appointment_id', e.record.id)
    $app.save(hist)
  } catch (err) {
    $app.logger().error('loyalty referral failed', 'error', err.message)
  }

  return e.next()
}, 'appointments')
