migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('prescriptions')

    col.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')"

    col.viewRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('prescriptions')

    col.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'medical_director')"

    col.viewRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'medical_director')"

    app.save(col)
  },
)
