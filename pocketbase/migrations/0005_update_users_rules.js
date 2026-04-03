migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.updateRule = 'id = @request.auth.id || parent_id = @request.auth.id'
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.updateRule = 'id = @request.auth.id'
    app.save(col)
  },
)
