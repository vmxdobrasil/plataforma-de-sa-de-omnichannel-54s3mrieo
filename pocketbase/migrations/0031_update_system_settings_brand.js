migrate(
  (app) => {
    let record
    try {
      const records = app.findRecordsByFilter('system_settings', "id != ''", '', 1, 0)
      if (records && records.length > 0) {
        record = records[0]
      }
    } catch (err) {
      // collection might be empty, ignore
    }

    if (!record) {
      const col = app.findCollectionByNameOrId('system_settings')
      record = new Record(col)
    }

    record.set('company_name', 'V MED')
    record.set('primary_color', '#00A34D')

    app.save(record)
  },
  (app) => {
    // Irreversible or not strictly needed to revert
  },
)
