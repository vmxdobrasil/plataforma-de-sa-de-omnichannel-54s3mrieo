migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        // Clear the logo to force the frontend to use the new local asset fallback
        record.set('logo', null)
        app.save(record)
      }
    } catch (err) {
      console.log(err)
    }
  },
  (app) => {
    // no-op
  },
)
