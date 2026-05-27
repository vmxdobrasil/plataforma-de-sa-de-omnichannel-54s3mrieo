migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('latitude')
    col.fields.removeByName('longitude')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('latitude')) {
      col.fields.add(new NumberField({ name: 'latitude' }))
    }
    if (!col.fields.getByName('longitude')) {
      col.fields.add(new NumberField({ name: 'longitude' }))
    }
    app.save(col)
  },
)
