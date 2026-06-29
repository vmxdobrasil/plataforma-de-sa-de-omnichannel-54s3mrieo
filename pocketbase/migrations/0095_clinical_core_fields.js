migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('rg')) users.fields.add(new TextField({ name: 'rg' }))
    if (!users.fields.getByName('rqe')) users.fields.add(new TextField({ name: 'rqe' }))
    if (!users.fields.getByName('sub_specialty'))
      users.fields.add(new TextField({ name: 'sub_specialty' }))
    if (!users.fields.getByName('continuous_medications'))
      users.fields.add(new TextField({ name: 'continuous_medications' }))
    if (!users.fields.getByName('date_of_birth'))
      users.fields.add(new DateField({ name: 'date_of_birth' }))
    if (!users.fields.getByName('consultation_value'))
      users.fields.add(new NumberField({ name: 'consultation_value' }))
    if (!users.fields.getByName('gender'))
      users.fields.add(
        new SelectField({ name: 'gender', values: ['male', 'female', 'other'], maxSelect: 1 }),
      )
    if (!users.fields.getByName('work_shift'))
      users.fields.add(
        new SelectField({
          name: 'work_shift',
          values: ['morning', 'afternoon', 'night', 'business'],
          maxSelect: 1,
        }),
      )
    if (!users.fields.getByName('payment_method'))
      users.fields.add(
        new SelectField({
          name: 'payment_method',
          values: ['private', 'corporate', 'pix', 'credit_card', 'cash'],
          maxSelect: 1,
        }),
      )
    if (!users.fields.getByName('professional_status'))
      users.fields.add(
        new SelectField({
          name: 'professional_status',
          values: ['active', 'inactive', 'vacation'],
          maxSelect: 1,
        }),
      )

    app.save(users)

    var slots = app.findCollectionByNameOrId('availability_slots')
    if (!slots.fields.getByName('slot_duration')) {
      slots.fields.add(new NumberField({ name: 'slot_duration', onlyInt: true }))
    }
    app.save(slots)

    var appts = app.findCollectionByNameOrId('appointments')
    if (!appts.fields.getByName('classification')) {
      appts.fields.add(
        new SelectField({
          name: 'classification',
          values: ['first_visit', 'follow_up', 'emergency', 'telemedicine'],
          maxSelect: 1,
        }),
      )
    }
    if (!appts.fields.getByName('cancellation_reason')) {
      appts.fields.add(new TextField({ name: 'cancellation_reason' }))
    }
    if (!appts.fields.getByName('cancelled_by')) {
      appts.fields.add(
        new RelationField({ name: 'cancelled_by', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }
    appts.addIndex('idx_appt_doctor_datetime', false, 'professional_id,dateTime', '')
    app.save(appts)
  },
  (app) => {
    var users = app.findCollectionByNameOrId('users')
    ;[
      'rg',
      'rqe',
      'sub_specialty',
      'continuous_medications',
      'date_of_birth',
      'consultation_value',
      'gender',
      'work_shift',
      'payment_method',
      'professional_status',
    ].forEach(function (n) {
      if (users.fields.getByName(n)) users.fields.removeByName(n)
    })
    app.save(users)

    var slots = app.findCollectionByNameOrId('availability_slots')
    if (slots.fields.getByName('slot_duration')) slots.fields.removeByName('slot_duration')
    app.save(slots)

    var appts = app.findCollectionByNameOrId('appointments')
    ;['classification', 'cancellation_reason', 'cancelled_by'].forEach(function (n) {
      if (appts.fields.getByName(n)) appts.fields.removeByName(n)
    })
    appts.removeIndex('idx_appt_doctor_datetime')
    app.save(appts)
  },
)
