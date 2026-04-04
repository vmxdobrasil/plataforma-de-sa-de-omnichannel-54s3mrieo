migrate(
  (app) => {
    const transactions = app.findCollectionByNameOrId('benefit_transactions')
    if (!transactions.fields.getByName('category')) {
      transactions.fields.add(
        new SelectField({
          name: 'category',
          values: ['health_service', 'medication'],
          required: false,
        }),
      )
    }
    app.save(transactions)
  },
  (app) => {
    const transactions = app.findCollectionByNameOrId('benefit_transactions')
    transactions.fields.removeByName('category')
    app.save(transactions)
  },
)
