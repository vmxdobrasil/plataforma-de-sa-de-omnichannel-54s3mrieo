routerAdd(
  'POST',
  '/backend/v1/company/execute-renewal',
  (e) => {
    const authRecord = e.auth
    if (!authRecord || authRecord.get('role') !== 'company') {
      throw new ForbiddenError('Only companies can execute renewals.')
    }

    const companyId = authRecord.id

    let employees
    try {
      employees = $app.findRecordsByFilter(
        'users',
        'company_id = {:companyId} && auto_renew_benefits = true',
        '',
        0,
        0,
        { companyId: companyId },
      )
    } catch (err) {
      employees = []
    }

    const date = new Date()
    const monthYear = (date.getMonth() + 1).toString().padStart(2, '0') + '/' + date.getFullYear()

    let count = 0

    try {
      $app.runInTransaction((txApp) => {
        for (const emp of employees) {
          const healthAllowance = emp.get('health_allowance') || 0
          const medAllowance = emp.get('medication_allowance') || 0

          if (healthAllowance > 0) {
            const bt = new Record(txApp.findCollectionByNameOrId('benefit_transactions'))
            bt.set('employee_id', emp.id)
            bt.set('company_id', companyId)
            bt.set('amount', healthAllowance)
            bt.set('type', 'credit')
            bt.set('category', 'health_service')
            bt.set('description', 'Monthly benefit renewal - ' + monthYear)
            txApp.save(bt)
            count++
          }

          if (medAllowance > 0) {
            const bt = new Record(txApp.findCollectionByNameOrId('benefit_transactions'))
            bt.set('employee_id', emp.id)
            bt.set('company_id', companyId)
            bt.set('amount', medAllowance)
            bt.set('type', 'credit')
            bt.set('category', 'medication')
            bt.set('description', 'Monthly benefit renewal - ' + monthYear)
            txApp.save(bt)
            count++
          }
        }
      })
    } catch (err) {
      throw new InternalServerError('Failed to execute renewal transaction: ' + err.message)
    }

    return e.json(200, {
      success: true,
      transactionsCreated: count,
      employeesProcessed: employees.length,
    })
  },
  $apis.requireAuth(),
)
