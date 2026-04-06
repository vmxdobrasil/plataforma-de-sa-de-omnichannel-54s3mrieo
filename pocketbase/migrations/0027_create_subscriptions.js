migrate(
  (app) => {
    const products = app.findCollectionByNameOrId('products')
    const users = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      name: 'subscriptions',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: null,
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: users.id, maxSelect: 1 },
        {
          name: 'product_id',
          type: 'relation',
          required: true,
          collectionId: products.id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'inactive', 'expired'],
        },
        { name: 'valid_until', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('subscriptions')
    app.delete(collection)
  },
)
