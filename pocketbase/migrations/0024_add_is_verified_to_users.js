migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('is_verified')) {
      col.fields.add(new BoolField({ name: 'is_verified' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('is_verified')
    app.save(col)
  },
)
