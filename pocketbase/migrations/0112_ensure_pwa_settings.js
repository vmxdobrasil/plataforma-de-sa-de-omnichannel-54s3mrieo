// 0111 was applied in PB; this 0112 ensures any PWA settings are verified or default values exist
migrate(
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId('system_settings')
      // Check if we have an initial settings record
      let record
      try {
        const records = app.findRecordsByFilter('system_settings', '', '-created', 1, 0)
        if (records.length > 0) {
          record = records[0]
        }
      } catch (_) {}

      if (!record) {
        record = new Record(settings)
        record.set('company_name', 'V MED BRASIL')
        record.set('primary_color', '#14805A')
        app.save(record)
      } else {
        if (!record.get('company_name')) {
          record.set('company_name', 'V MED BRASIL')
        }
        if (!record.get('primary_color')) {
          record.set('primary_color', '#14805A')
        }
        app.save(record)
      }
    } catch (err) {
      console.log('0112_ensure_pwa_settings notice:', err)
    }
  },
  (app) => {
    // no-op
  },
)
