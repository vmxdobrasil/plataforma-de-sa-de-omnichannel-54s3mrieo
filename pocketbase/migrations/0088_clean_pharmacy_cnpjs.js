migrate(
  (app) => {
    const cnpjsToClean = ['02.130.783/0001-53', '02.939.981/0001-62']

    cnpjsToClean.forEach((formatted) => {
      const unformatted = formatted.replace(/\D/g, '')

      // Get all records with formatted or unformatted CNPJ
      const formattedRecords = app.findRecordsByFilter('users', `tax_id = '${formatted}'`)
      const unformattedRecords = app.findRecordsByFilter('users', `tax_id = '${unformatted}'`)

      const allRecords = [...formattedRecords, ...unformattedRecords]

      if (allRecords.length > 0) {
        // Deduplicate by ID
        const uniqueRecordsMap = new Map()
        allRecords.forEach((r) => uniqueRecordsMap.set(r.id, r))
        const uniqueRecords = Array.from(uniqueRecordsMap.values())

        // Sort by created ascending so we keep the oldest
        uniqueRecords.sort((a, b) => {
          const da = new Date(a.get('created')).getTime()
          const db = new Date(b.get('created')).getTime()
          return da - db
        })

        const toKeep = uniqueRecords[0]

        // Ensure tax_id is normalized to numbers only
        toKeep.set('tax_id', unformatted)

        // Delete duplicates
        for (let i = 1; i < uniqueRecords.length; i++) {
          app.delete(uniqueRecords[i])
        }

        // Save the single kept record
        app.save(toKeep)
      }
    })
  },
  (app) => {
    // Revert is not safely possible for deleted duplicates
  },
)
