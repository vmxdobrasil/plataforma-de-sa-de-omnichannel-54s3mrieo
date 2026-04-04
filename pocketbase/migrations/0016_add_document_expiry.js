migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('documents')
    if (!collection.fields.getByName('expiry_date')) {
      collection.fields.add(new DateField({ name: 'expiry_date' }))
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('documents')
    collection.fields.removeByName('expiry_date')
    app.save(collection)
  },
)
