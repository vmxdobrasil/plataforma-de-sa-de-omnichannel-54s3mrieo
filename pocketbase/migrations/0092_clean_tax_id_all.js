migrate((app) => {
  const records = app.findRecordsByFilter('users', "tax_id != ''", 'created', 100000, 0)

  for (const record of records) {
    const original = record.getString('tax_id')
    const clean = original.replace(/\D/g, '')

    if (original !== clean) {
      if (!clean) {
        record.set('tax_id', '')
        app.saveNoValidate(record)
        continue
      }

      try {
        const existing = app.findFirstRecordByData('users', 'tax_id', clean)
        if (existing && existing.id !== record.id) {
          // It's a duplicate, we clear the tax_id to resolve constraint
          record.set('tax_id', '')
          app.saveNoValidate(record)
        } else {
          record.set('tax_id', clean)
          app.saveNoValidate(record)
        }
      } catch (_) {
        record.set('tax_id', clean)
        app.saveNoValidate(record)
      }
    }
  }
})
