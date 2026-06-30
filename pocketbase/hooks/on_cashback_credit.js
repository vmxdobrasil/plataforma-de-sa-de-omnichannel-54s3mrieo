onRecordAfterUpdateSuccess((e) => {
  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')
  if (newStatus !== 'completed' || oldStatus === 'completed') return e.next()

  var patientId = e.record.getString('patient_id')
  var classification = e.record.getString('classification') || 'health_service'
  if (!patientId) return e.next()

  var category = 'health_service'
  if (classification === 'exam') category = 'exam'
  else if (classification === 'emergency') category = 'emergency_service'

  try {
    $app.findFirstRecordByFilter(
      'loyalty_points_history',
      "reason = 'cashback' && related_appointment_id = '" + e.record.id + "'",
    )
    return e.next()
  } catch (_) {}

  var percentage = 0
  try {
    var rule = $app.findFirstRecordByFilter(
      'regras_cashback',
      "category = '" + category + "' && is_active = true",
    )
    percentage = Number(rule.get('percentage')) || 0
  } catch (_) {
    return e.next()
  }

  if (percentage <= 0) return e.next()

  var amount = 0
  try {
    var tx = $app.findFirstRecordByFilter(
      'benefit_transactions',
      "appointment_id = '" + e.record.id + "'",
    )
    amount = Number(tx.get('amount')) || 0
  } catch (_) {}

  if (amount <= 0) {
    try {
      var prof = $app.findRecordById('users', e.record.getString('professional_id'))
      amount = Number(prof.get('consultation_value')) || 0
    } catch (_) {}
  }

  if (amount <= 0) return e.next()

  var cashbackPoints = Math.round(((amount * percentage) / 100) * 100)

  try {
    var patient = $app.findRecordById('users', patientId)
    var currentPoints = patient.getInt('loyalty_points') || 0
    patient.set('loyalty_points', currentPoints + cashbackPoints)
    $app.save(patient)

    var histCol = $app.findCollectionByNameOrId('loyalty_points_history')
    var hist = new Record(histCol)
    hist.set('user_id', patientId)
    hist.set('points_delta', cashbackPoints)
    hist.set('reason', 'cashback')
    hist.set('related_appointment_id', e.record.id)
    $app.save(hist)
  } catch (err) {
    $app.logger().error('cashback credit failed', 'error', err.message)
  }

  return e.next()
}, 'appointments')
