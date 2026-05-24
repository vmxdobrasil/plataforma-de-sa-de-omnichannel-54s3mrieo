migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(
      new NumberField({
        name: 'pending_commission_rate',
        required: false,
      }),
    )
    app.save(users)

    const tx = app.findCollectionByNameOrId('benefit_transactions')
    tx.fields.add(
      new RelationField({
        name: 'partner_id',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(tx)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('pending_commission_rate')
    app.save(users)

    const tx = app.findCollectionByNameOrId('benefit_transactions')
    tx.fields.removeByName('partner_id')
    app.save(tx)
  },
)
