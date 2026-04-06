migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('messages')
    collection.fields.add(
      new FileField({
        name: 'file',
        maxSelect: 1,
        maxSize: 52428800,
        mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      }),
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('messages')
    collection.fields.removeByName('file')
    app.save(collection)
  },
)
