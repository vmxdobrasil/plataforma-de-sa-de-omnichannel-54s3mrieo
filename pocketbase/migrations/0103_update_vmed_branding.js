migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        record.set('company_name', 'V MED Brasil')
        record.set('primary_color', '#14805A')
        app.save(record)
      } else {
        const col = app.findCollectionByNameOrId('system_settings')
        const record = new Record(col)
        record.set('company_name', 'V MED Brasil')
        record.set('primary_color', '#14805A')
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        record.set('company_name', 'V MED BRASIL')
        record.set('primary_color', '#00A34D')
        app.save(record)
      }
    } catch (_) {}
  },
)
