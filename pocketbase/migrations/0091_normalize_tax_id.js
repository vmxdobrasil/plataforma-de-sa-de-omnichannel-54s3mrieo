migrate(
  (app) => {
    // Find all users with pharmacy or laboratory role that have a tax_id
    const records = app.findRecordsByFilter(
      'users',
      "(role = 'pharmacy' || role = 'laboratory') && tax_id != ''",
      '',
      10000,
      0,
    )

    for (const record of records) {
      const currentTaxId = record.getString('tax_id')
      const normalized = currentTaxId.replace(/\D/g, '')

      if (currentTaxId !== normalized && normalized.length > 0) {
        record.set('tax_id', normalized)

        try {
          // Save without validation to force the update even if other fields might be invalid
          app.saveNoValidate(record)
        } catch (e) {
          console.log(`Failed to normalize tax_id for user ${record.id}: ${e.message}`)
        }
      }
    }
  },
  (app) => {
    // Reverting this migration is not safely possible without a backup,
    // as we don't know the original formatting of the CNPJs.
  },
)
