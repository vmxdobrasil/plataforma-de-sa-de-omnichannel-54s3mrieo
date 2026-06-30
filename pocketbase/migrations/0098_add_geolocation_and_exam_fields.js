migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('lat')) {
      users.fields.add(new NumberField({ name: 'lat' }))
    }
    if (!users.fields.getByName('lng')) {
      users.fields.add(new NumberField({ name: 'lng' }))
    }
    app.save(users)

    const appts = app.findCollectionByNameOrId('appointments')
    appts.fields.removeByName('classification')
    appts.fields.add(
      new SelectField({
        name: 'classification',
        values: ['first_visit', 'follow_up', 'emergency', 'telemedicine', 'exam'],
        maxSelect: 1,
      }),
    )
    app.save(appts)

    const tx = app.findCollectionByNameOrId('benefit_transactions')
    tx.fields.removeByName('category')
    tx.fields.add(
      new SelectField({
        name: 'category',
        values: ['health_service', 'medication', 'preventive_service', 'emergency_service', 'exam'],
      }),
    )
    app.save(tx)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('lat')
    users.fields.removeByName('lng')
    app.save(users)

    const appts = app.findCollectionByNameOrId('appointments')
    appts.fields.removeByName('classification')
    appts.fields.add(
      new SelectField({
        name: 'classification',
        values: ['first_visit', 'follow_up', 'emergency', 'telemedicine'],
        maxSelect: 1,
      }),
    )
    app.save(appts)

    const tx = app.findCollectionByNameOrId('benefit_transactions')
    tx.fields.removeByName('category')
    tx.fields.add(
      new SelectField({
        name: 'category',
        values: ['health_service', 'medication', 'preventive_service', 'emergency_service'],
      }),
    )
    app.save(tx)
  },
)
