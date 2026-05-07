migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('system_settings')
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records.length > 0) {
        const record = records[0]
        record.set('company_name', 'V MED BRASIL')
        app.save(record)
      } else {
        const record = new Record(collection)
        record.set('company_name', 'V MED BRASIL')
        app.save(record)
      }
    } catch (e) {
      const record = new Record(collection)
      record.set('company_name', 'V MED BRASIL')
      app.save(record)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('system_settings')
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records.length > 0) {
        const record = records[0]
        record.set('company_name', 'Vmx do Brasil')
        app.save(record)
      }
    } catch (e) {}
  },
)
