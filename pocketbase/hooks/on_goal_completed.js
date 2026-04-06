onRecordUpdateRequest((e) => {
  const newStatus = e.requestInfo().body.status
  const oldStatus = e.record.get('status')

  if (oldStatus !== 'completed' && newStatus === 'completed') {
    const patientId = e.record.get('patient_id')
    const points = e.record.get('points_reward')

    const user = $app.findRecordById('users', patientId)
    const currentPoints = user.get('loyalty_points') || 0
    user.set('loyalty_points', currentPoints + points)

    $app.saveNoValidate(user)
  }

  e.next()
}, 'health_goals')
