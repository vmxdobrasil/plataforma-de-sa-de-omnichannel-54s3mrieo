migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    if (!col.fields.getByName('low_balance_threshold')) {
      col.fields.add(
        new NumberField({
          name: 'low_balance_threshold',
          min: 0,
          presentable: false,
          required: false,
        }),
      )
    }

    app.save(col)

    // Set default value for existing records
    app
      .db()
      .newQuery('UPDATE users SET low_balance_threshold = 50.0 WHERE low_balance_threshold IS NULL')
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('low_balance_threshold')
    app.save(col)
  },
)
