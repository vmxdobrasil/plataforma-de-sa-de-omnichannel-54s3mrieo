migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.removeIndex('idx_users_tax_id')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.addIndex('idx_users_tax_id', true, 'tax_id', "tax_id != ''")
    app.save(col)
  },
)
