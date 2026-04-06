migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      name: 'brand_kits',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: null,
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: users.id, maxSelect: 1 },
        { name: 'primary_color', type: 'text' },
        { name: 'secondary_color', type: 'text' },
        {
          name: 'tone',
          type: 'select',
          values: ['Professional', 'Empathetic', 'Educational', 'Informative'],
        },
        { name: 'audience_description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_brand_kits_user ON brand_kits (user_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('brand_kits')
    app.delete(collection)
  },
)
