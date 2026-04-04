migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('medication_allowance')) {
      users.fields.add(new NumberField({ name: 'medication_allowance', required: false }))
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('medication_allowance')
    app.save(users)
  },
)
