migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('registration_leads')
    col.fields.removeByName('type')
    col.fields.add(
      new SelectField({
        name: 'type',
        required: true,
        values: ['company', 'partner', 'individual', 'professional'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('registration_leads')
    col.fields.removeByName('type')
    col.fields.add(
      new SelectField({
        name: 'type',
        required: true,
        values: ['company', 'partner', 'individual'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
)
