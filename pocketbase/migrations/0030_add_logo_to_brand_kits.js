migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('brand_kits')

    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 2097152, // 2MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('brand_kits')
    col.fields.removeByName('logo')
    app.save(col)
  },
)
