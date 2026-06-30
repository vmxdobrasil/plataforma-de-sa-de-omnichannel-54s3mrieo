routerAdd(
  'POST',
  '/backend/v1/invoices/generate',
  (e) => {
    var body = e.requestInfo().body || {}
    var companyId = body.company_id || ''
    var periodStart = body.period_start || ''
    var periodEnd = body.period_end || ''

    if (!companyId || !periodStart || !periodEnd) {
      return e.badRequestError('company_id, period_start, and period_end are required')
    }

    var authRole = e.auth ? e.auth.getString('role') : ''
    if (authRole !== 'admin' && authRole !== 'medical_director') {
      return e.forbiddenError('Only admins can generate invoices')
    }

    var transactions = $app.findRecordsByFilter(
      'benefit_transactions',
      "company_id = '" +
        companyId +
        "' && type = 'debit' && created >= '" +
        periodStart +
        " 00:00:00' && created <= '" +
        periodEnd +
        " 23:59:59'",
      '-created',
      500,
      0,
    )

    var totalAmount = 0
    var details = []
    for (var i = 0; i < transactions.length; i++) {
      var t = transactions[i]
      var amt = Number(t.get('amount')) || 0
      totalAmount += amt
      var empName = ''
      try {
        var emp = $app.findRecordById('users', t.getString('employee_id'))
        empName = emp.getString('name') || ''
      } catch (_) {}
      details.push({
        id: t.id,
        date: t.getString('created'),
        employee_name: empName,
        service_type: t.getString('category') || '',
        amount: amt,
        description: t.getString('description') || '',
      })
    }

    var faturaCol = $app.findCollectionByNameOrId('faturas_empresas')
    var fatura = new Record(faturaCol)
    fatura.set('company_id', companyId)
    fatura.set('billing_period_start', periodStart)
    fatura.set('billing_period_end', periodEnd)
    fatura.set('total_amount', totalAmount)
    fatura.set('status', 'open')
    $app.save(fatura)

    return e.json(200, {
      invoice_id: fatura.id,
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: totalAmount,
      status: 'open',
      transaction_count: transactions.length,
      details: details,
    })
  },
  $apis.requireAuth(),
)
