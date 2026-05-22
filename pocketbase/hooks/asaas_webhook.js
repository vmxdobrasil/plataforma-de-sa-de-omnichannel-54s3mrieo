routerAdd('POST', '/backend/v1/asaas/webhook', (e) => {
  const body = e.requestInfo().body

  if (
    body.event === 'PAYMENT_RECEIVED' ||
    body.event === 'PAYMENT_CONFIRMED' ||
    body.event === 'PAYMENT_MOCKED'
  ) {
    const payment = body.payment || body // handle mock structure if needed
    const txId = payment.externalReference || body.externalReference

    if (txId) {
      try {
        const tx = $app.findRecordById('benefit_transactions', txId)
        if (tx.getString('payment_status') !== 'confirmed') {
          tx.set('payment_status', 'confirmed')
          $app.save(tx)

          const desc = tx.getString('description') || ''

          if (
            desc.includes('Adição de Crédito') ||
            (tx.getString('category') === 'health_service' && tx.getString('type') === 'credit')
          ) {
            const emp = $app.findRecordById('users', tx.getString('employee_id'))
            const curr = Number(emp.get('health_allowance')) || 0
            emp.set('health_allowance', curr + Number(tx.get('amount')))
            $app.save(emp)
          }

          if (desc.startsWith('Compra:')) {
            const prodId = desc.split(':')[1].trim()
            try {
              const prod = $app.findRecordById('products', prodId)

              const sub = new Record($app.findCollectionByNameOrId('subscriptions'))
              sub.set('user_id', tx.getString('employee_id'))
              sub.set('product_id', prod.getId())
              sub.set('status', 'active')
              const validUntil = new Date()
              validUntil.setFullYear(validUntil.getFullYear() + 1)
              sub.set('valid_until', validUntil.toISOString())
              $app.save(sub)
            } catch (err) {
              $app.logger().error('Product not found for subscription', 'prodId', prodId)
            }
          }
        }
      } catch (err) {
        $app.logger().warn('Webhook Tx not found', 'txId', txId)
      }
    }
  }

  return e.json(200, { received: true })
})
