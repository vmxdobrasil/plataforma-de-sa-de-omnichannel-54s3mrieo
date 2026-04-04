migrate(
  (app) => {
    const prescriptions = app.findCollectionByNameOrId('prescriptions')
    prescriptions.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id)"
    prescriptions.viewRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id)"
    app.save(prescriptions)

    const healthRecords = app.findCollectionByNameOrId('health_records')
    healthRecords.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id)"
    healthRecords.viewRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id)"
    app.save(healthRecords)

    const appointments = app.findCollectionByNameOrId('appointments')
    appointments.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'company')"
    appointments.viewRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'company')"
    app.save(appointments)
  },
  (app) => {
    const prescriptions = app.findCollectionByNameOrId('prescriptions')
    prescriptions.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)"
    prescriptions.viewRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)"
    app.save(prescriptions)

    const healthRecords = app.findCollectionByNameOrId('health_records')
    healthRecords.listRule = "@request.auth.id != ''"
    healthRecords.viewRule = "@request.auth.id != ''"
    app.save(healthRecords)

    const appointments = app.findCollectionByNameOrId('appointments')
    appointments.listRule = "@request.auth.id != ''"
    appointments.viewRule = "@request.auth.id != ''"
    app.save(appointments)
  },
)
