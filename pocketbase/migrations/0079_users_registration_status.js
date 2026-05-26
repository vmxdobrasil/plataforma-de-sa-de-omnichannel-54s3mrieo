migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('registration_status')) {
      users.fields.add(
        new SelectField({
          name: 'registration_status',
          values: ['pending', 'approved', 'rejected'],
          maxSelect: 1,
        }),
      )
    }

    // Deduplicate tax_id just in case
    app
      .db()
      .newQuery(`
    UPDATE users SET tax_id = '' WHERE id NOT IN (
      SELECT MIN(id) FROM users GROUP BY tax_id
    ) AND tax_id != '' AND tax_id IS NOT NULL
  `)
      .execute()

    users.addIndex('idx_users_tax_id', true, 'tax_id', "tax_id != ''")
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('registration_status')
    users.removeIndex('idx_users_tax_id')
    app.save(users)
  },
)
