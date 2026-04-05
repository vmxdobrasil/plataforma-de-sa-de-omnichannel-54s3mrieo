migrate(
  (app) => {
    try {
      app.findFirstRecordByData('system_settings', 'company_name', 'V MED')
      return
    } catch (_) {}

    const col = app.findCollectionByNameOrId('system_settings')
    const record = new Record(col)
    record.set('company_name', 'V MED')
    record.set('primary_color', '#0ea5e9')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('system_settings', 'company_name', 'V MED')
      app.delete(record)
    } catch (_) {}
  },
)
