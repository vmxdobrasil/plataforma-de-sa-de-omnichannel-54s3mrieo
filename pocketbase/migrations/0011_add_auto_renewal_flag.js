migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('auto_renew_benefits')) {
      users.fields.add(new BoolField({ name: 'auto_renew_benefits' }))
    }
    app.save(users)

    const txs = app.findCollectionByNameOrId('benefit_transactions')
    if (!txs.fields.getByName('description')) {
      txs.fields.add(new TextField({ name: 'description' }))
    }
    app.save(txs)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('auto_renew_benefits')
    app.save(users)

    const txs = app.findCollectionByNameOrId('benefit_transactions')
    txs.fields.removeByName('description')
    app.save(txs)
  },
)
