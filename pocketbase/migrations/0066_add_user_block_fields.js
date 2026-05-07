migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('is_blocked')) {
      users.fields.add(new BoolField({ name: 'is_blocked' }))
    }

    if (!users.fields.getByName('block_reason')) {
      users.fields.add(new TextField({ name: 'block_reason' }))
    }

    // Grant medical_director access to update users
    users.updateRule =
      "id = @request.auth.id || parent_id = @request.auth.id || company_id = @request.auth.id || @request.auth.role = 'medical_director'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.removeByName('is_blocked')
    users.fields.removeByName('block_reason')

    users.updateRule =
      'id = @request.auth.id || parent_id = @request.auth.id || company_id = @request.auth.id'

    app.save(users)
  },
)
