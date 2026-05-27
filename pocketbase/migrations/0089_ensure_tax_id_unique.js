migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.addIndex('idx_users_tax_id', true, 'tax_id', "tax_id != ''")
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.removeIndex('idx_users_tax_id')
    app.save(col)
  },
)
