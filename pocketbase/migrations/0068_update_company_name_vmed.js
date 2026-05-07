migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        record.set('company_name', 'V MED BRASIL')
        app.save(record)
      }
    } catch (_) {
      // collection might be empty or missing
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        record.set('company_name', 'Omnichannel Health')
        app.save(record)
      }
    } catch (_) {
      // ignore
    }
  },
)
