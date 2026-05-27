migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'users',
        "role = 'pharmacy' && (tax_id = '02.130.783/0001-53' || tax_id = '02130783000153')",
        '',
        10,
        0,
      )
      for (const record of records) {
        app.delete(record)
      }
    } catch (_) {}
  },
  (app) => {},
)
