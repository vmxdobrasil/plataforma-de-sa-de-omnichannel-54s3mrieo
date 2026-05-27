migrate((app) => {
  const targetTaxId = '02130783000153'

  try {
    const records = app.findRecordsByFilter('users', `tax_id = '${targetTaxId}'`, 'created', 100, 0)

    if (records.length > 1) {
      for (let i = 1; i < records.length; i++) {
        app.delete(records[i])
      }
    } else if (records.length === 1) {
      const record = records[0]
      if (record.getString('role') !== 'pharmacy' && record.getString('role') !== 'laboratory') {
        record.set('role', 'pharmacy')
        app.saveNoValidate(record)
      }
    }
  } catch (err) {
    console.log('Error cleaning specific CNPJ', err)
  }
})
