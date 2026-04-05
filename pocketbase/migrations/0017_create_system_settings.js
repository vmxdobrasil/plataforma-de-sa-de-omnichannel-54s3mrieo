migrate(
  (app) => {
    const collection = new Collection({
      name: 'system_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'company'",
      updateRule: "@request.auth.role = 'company'",
      deleteRule: null,
      fields: [
        { name: 'company_name', type: 'text' },
        { name: 'primary_color', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('system_settings')
    app.delete(collection)
  },
)
