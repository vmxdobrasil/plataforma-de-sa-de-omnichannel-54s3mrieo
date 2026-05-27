migrate((app) => {
  try {
    // 02.130.783/0001-53 without formatting
    const record = app.findFirstRecordByData('users', 'tax_id', '02130783000153')
    let changed = false

    if (!record.getString('registration_status')) {
      record.set('registration_status', 'pending')
      changed = true
    }

    const role = record.getString('role')
    if (role !== 'pharmacy' && role !== 'laboratory') {
      record.set('role', 'pharmacy')
      changed = true
    }

    if (changed) {
      app.saveNoValidate(record)
    }
  } catch (err) {
    // record not found, ignore
  }
})
