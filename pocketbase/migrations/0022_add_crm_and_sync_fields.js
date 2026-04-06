migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('crm_number')) {
      users.fields.add(new TextField({ name: 'crm_number' }))
    }
    if (!users.fields.getByName('crm_state')) {
      users.fields.add(new TextField({ name: 'crm_state' }))
    }
    if (!users.fields.getByName('allow_external_sync')) {
      users.fields.add(new BoolField({ name: 'allow_external_sync' }))
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('crm_number')
    users.fields.removeByName('crm_state')
    users.fields.removeByName('allow_external_sync')
    app.save(users)
  },
)
