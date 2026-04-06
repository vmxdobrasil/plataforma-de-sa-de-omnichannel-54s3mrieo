routerAdd(
  'GET',
  '/backend/v1/company/{id}/analytics',
  (e) => {
    const companyId = e.request.pathValue('id')
    if (!e.auth || (e.auth.id !== companyId && e.auth.get('role') !== 'company')) {
      throw new ForbiddenError('Not allowed')
    }

    const appointments = $app.findRecordsByFilter(
      'appointments',
      `patient_id.company_id = {:companyId}`,
      '',
      10000,
      0,
      { companyId: companyId },
    )
    const apptByType = {}
    appointments.forEach((a) => {
      const t = a.get('type') || 'Outro'
      apptByType[t] = (apptByType[t] || 0) + 1
    })

    const records = $app.findRecordsByFilter(
      'health_records',
      `patient_id.company_id = {:companyId}`,
      '',
      10000,
      0,
      { companyId: companyId },
    )
    const recordsByType = {}
    records.forEach((r) => {
      const t = r.get('type') || 'Outro'
      recordsByType[t] = (recordsByType[t] || 0) + 1
    })

    return e.json(200, {
      appointments: apptByType,
      health_records: recordsByType,
    })
  },
  $apis.requireAuth(),
)
