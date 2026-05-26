migrate(
  (app) => {
    const docs = app.findCollectionByNameOrId('documents')
    docs.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'company' || @request.auth.role = 'medical_director' || @request.auth.role = 'admin' || (@request.auth.role = 'pharmacy' && patient_id = @request.auth.id) || (@request.auth.role = 'laboratory' && patient_id = @request.auth.id))"
    docs.viewRule = docs.listRule
    app.save(docs)
  },
  (app) => {
    const docs = app.findCollectionByNameOrId('documents')
    docs.listRule =
      "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'company' || (@request.auth.role = 'medical_director' || @request.auth.role = 'admin'))"
    docs.viewRule = docs.listRule
    app.save(docs)
  },
)
