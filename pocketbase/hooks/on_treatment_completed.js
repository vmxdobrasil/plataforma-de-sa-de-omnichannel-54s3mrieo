onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = e.original

  if (record.get('status') === 'completed' && original.get('status') !== 'completed') {
    const patientId = record.get('patient_id')
    try {
      const patient = $app.findRecordById('users', patientId)
      const currentPoints = patient.get('loyalty_points') || 0
      patient.set('loyalty_points', currentPoints + 50)
      $app.save(patient)
    } catch (err) {
      console.log('Error updating loyalty points', err)
    }
  }
  e.next()
}, 'treatment_plans')
