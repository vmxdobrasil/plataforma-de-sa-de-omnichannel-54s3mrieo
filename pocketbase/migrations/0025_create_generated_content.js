migrate(
  (app) => {
    const collection = new Collection({
      name: 'generated_content',
      type: 'base',
      listRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      createRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      fields: [
        {
          name: 'professional_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('users').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'specialty', type: 'text' },
        { name: 'topic', type: 'text', required: true },
        {
          name: 'content_type',
          type: 'select',
          required: true,
          values: ['Instagram Post', 'Reels Script', 'LinkedIn Article', 'Patient Guide'],
          maxSelect: 1,
        },
        {
          name: 'tone',
          type: 'select',
          required: true,
          values: ['Informative', 'Empathetic', 'Professional', 'Educational'],
          maxSelect: 1,
        },
        { name: 'generated_text', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('generated_content')
    app.delete(collection)
  },
)
