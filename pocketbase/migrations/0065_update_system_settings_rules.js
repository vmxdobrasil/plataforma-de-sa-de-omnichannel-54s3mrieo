migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('system_settings')
    col.createRule = "@request.auth.role = 'company' || @request.auth.role = 'medical_director'"
    col.updateRule = "@request.auth.role = 'company' || @request.auth.role = 'medical_director'"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('system_settings')
    col.createRule = "@request.auth.role = 'company'"
    col.updateRule = "@request.auth.role = 'company'"
    app.save(col)
  },
)
