cronAdd('monthly_renewal', '0 0 1 * *', () => {
  const users = $app.findRecordsByFilter(
    'users',
    "auto_renew_benefits = true && company_id != ''",
    '',
    10000,
    0,
  )

  const txCol = $app.findCollectionByNameOrId('benefit_transactions')

  $app.runInTransaction((txApp) => {
    for (const user of users) {
      const health = user.get('health_allowance') || 0
      const med = user.get('medication_allowance') || 0
      const companyId = user.get('company_id')

      if (health > 0) {
        const tx = new Record(txCol)
        tx.set('employee_id', user.id)
        tx.set('company_id', companyId)
        tx.set('amount', health)
        tx.set('type', 'credit')
        tx.set('category', 'health_service')
        tx.set('description', 'Monthly Automatic Renewal')
        txApp.save(tx)
      }

      if (med > 0) {
        const tx2 = new Record(txCol)
        tx2.set('employee_id', user.id)
        tx2.set('company_id', companyId)
        tx2.set('amount', med)
        tx2.set('type', 'credit')
        tx2.set('category', 'medication')
        tx2.set('description', 'Monthly Automatic Renewal')
        txApp.save(tx2)
      }
    }
  })
})
