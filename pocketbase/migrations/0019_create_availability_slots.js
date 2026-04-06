migrate(
  (app) => {
    const collection = new Collection({
      name: 'availability_slots',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      fields: [
        {
          name: 'professional_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'day_of_week',
          type: 'select',
          required: true,
          values: ['0', '1', '2', '3', '4', '5', '6'],
        },
        { name: 'start_time', type: 'text', required: true },
        { name: 'end_time', type: 'text', required: true },
        {
          name: 'slot_type',
          type: 'select',
          required: true,
          values: ['Presencial', 'Online', 'Domiciliar'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('availability_slots')
    app.delete(collection)
  },
)
