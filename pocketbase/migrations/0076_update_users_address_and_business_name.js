migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('business_name'))
      col.fields.add(new TextField({ name: 'business_name' }))
    if (!col.fields.getByName('address_street'))
      col.fields.add(new TextField({ name: 'address_street' }))
    if (!col.fields.getByName('address_number'))
      col.fields.add(new TextField({ name: 'address_number' }))
    if (!col.fields.getByName('address_neighborhood'))
      col.fields.add(new TextField({ name: 'address_neighborhood' }))
    if (!col.fields.getByName('address_zip_code'))
      col.fields.add(new TextField({ name: 'address_zip_code' }))
    if (!col.fields.getByName('address_complement'))
      col.fields.add(new TextField({ name: 'address_complement' }))

    app.save(col)

    // Seed/Data Migration: Ensure existing MAXFARMA record is updated with business name
    try {
      const maxfarma = app.findFirstRecordByData('_pb_users_auth_', 'name', 'MAXFARMA')
      maxfarma.set('name', 'MAXFARMA') // Trade name
      maxfarma.set('business_name', 'MAXFARMA - Simões e Silva Ltda')
      app.save(maxfarma)
    } catch (_) {
      // Record does not exist, ignore
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    col.fields.removeByName('business_name')
    col.fields.removeByName('address_street')
    col.fields.removeByName('address_number')
    col.fields.removeByName('address_neighborhood')
    col.fields.removeByName('address_zip_code')
    col.fields.removeByName('address_complement')

    app.save(col)
  },
)
