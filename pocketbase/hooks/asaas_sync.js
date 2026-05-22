routerAdd(
  'POST',
  '/backend/v1/asaas/sync/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    try {
      const record = $app.findRecordById('benefit_transactions', id)

      if (record.getString('asaas_payment_id')) {
        record.set('payment_status', 'confirmed')
        $app.save(record)
      }

      return e.json(200, { success: true, status: record.getString('payment_status') })
    } catch (err) {
      return e.notFoundError('Transaction not found')
    }
  },
  $apis.requireAuth(),
)
