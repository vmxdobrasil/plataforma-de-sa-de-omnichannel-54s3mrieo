migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documents')

    col.updateRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')"
    col.deleteRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')"

    const typeField = col.fields.getByName('type')
    if (typeField && Array.isArray(typeField.values)) {
      if (!typeField.values.includes('contract')) {
        typeField.values.push('contract')
      }
      if (!typeField.values.includes('legal_doc')) {
        typeField.values.push('legal_doc')
      }
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documents')

    col.updateRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)"
    col.deleteRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)"

    const typeField = col.fields.getByName('type')
    if (typeField && Array.isArray(typeField.values)) {
      typeField.values = typeField.values.filter((v) => v !== 'contract' && v !== 'legal_doc')
    }

    app.save(col)
  },
)
