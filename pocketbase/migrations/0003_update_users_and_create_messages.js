migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new RelationField({ name: 'parent_id', collectionId: users.id, maxSelect: 1 }))
    users.fields.add(
      new SelectField({
        name: 'blood_type',
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        maxSelect: 1,
      }),
    )
    users.fields.add(new TextField({ name: 'allergies' }))
    users.fields.add(new TextField({ name: 'emergency_contact_name' }))
    users.fields.add(new TextField({ name: 'emergency_contact_phone' }))
    users.fields.add(new NumberField({ name: 'loyalty_points' }))
    app.save(users)

    const messages = new Collection({
      name: 'messages',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (sender_id = @request.auth.id || receiver_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (sender_id = @request.auth.id || receiver_id = @request.auth.id)",
      createRule: "@request.auth.id != '' && sender_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (sender_id = @request.auth.id || receiver_id = @request.auth.id)",
      deleteRule: null,
      fields: [
        {
          name: 'sender_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        {
          name: 'receiver_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'is_read', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(messages)

    const prescriptions = new Collection({
      name: 'prescriptions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)",
      createRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && professional_id = @request.auth.id",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        {
          name: 'professional_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        { name: 'medications', type: 'text', required: true },
        { name: 'pharmacy_instructions', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(prescriptions)

    const appointments = app.findCollectionByNameOrId('appointments')
    const statusField = appointments.fields.getByName('status')
    statusField.values = ['scheduled', 'completed', 'cancelled', 'checked_in']
    app.save(appointments)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('parent_id')
    users.fields.removeByName('blood_type')
    users.fields.removeByName('allergies')
    users.fields.removeByName('emergency_contact_name')
    users.fields.removeByName('emergency_contact_phone')
    users.fields.removeByName('loyalty_points')
    app.save(users)

    const msgs = app.findCollectionByNameOrId('messages')
    app.delete(msgs)

    const prescs = app.findCollectionByNameOrId('prescriptions')
    app.delete(prescs)

    const appointments = app.findCollectionByNameOrId('appointments')
    const statusField = appointments.fields.getByName('status')
    statusField.values = ['scheduled', 'completed', 'cancelled']
    app.save(appointments)
  },
)
