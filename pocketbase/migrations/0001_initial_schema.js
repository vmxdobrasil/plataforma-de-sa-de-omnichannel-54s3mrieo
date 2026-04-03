migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({ name: 'role', values: ['patient', 'professional'], required: true }),
      )
    }
    if (!users.fields.getByName('specialty')) {
      users.fields.add(new TextField({ name: 'specialty' }))
    }
    if (!users.fields.getByName('bio')) {
      users.fields.add(new TextField({ name: 'bio' }))
    }
    if (!users.fields.getByName('phone')) {
      users.fields.add(new TextField({ name: 'phone' }))
    }
    if (!users.fields.getByName('document_id')) {
      users.fields.add(new TextField({ name: 'document_id' }))
    }
    app.save(users)

    const appointments = new Collection({
      name: 'appointments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          collectionId: users.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'professional_id',
          type: 'relation',
          collectionId: users.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'dateTime', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          values: ['Presencial', 'Online', 'Domiciliar'],
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['scheduled', 'completed', 'cancelled'],
          required: true,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(appointments)

    const health_records = new Collection({
      name: 'health_records',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          collectionId: users.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'professional_id',
          type: 'relation',
          collectionId: users.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: ['clinical', 'dental', 'aesthetic'],
          required: true,
        },
        { name: 'attachments', type: 'file', maxSelect: 5, maxSize: 5242880 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(health_records)

    const treatment_plans = new Collection({
      name: 'treatment_plans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          collectionId: users.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'status', type: 'select', values: ['active', 'completed'], required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(treatment_plans)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('appointments'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('health_records'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('treatment_plans'))
    } catch (e) {}
  },
)
