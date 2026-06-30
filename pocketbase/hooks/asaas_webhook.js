routerAdd('POST', '/backend/v1/asaas/webhook', (e) => {
  const body = e.requestInfo().body
  const event = body.event || ''
  const payment = body.payment || body
  const txId = payment.externalReference || body.externalReference

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_MOCKED') {
    if (txId) {
      try {
        const tx = $app.findRecordById('benefit_transactions', txId)
        if (tx.getString('payment_status') !== 'confirmed') {
          tx.set('payment_status', 'confirmed')
          $app.save(tx)

          const desc = tx.getString('description') || ''
          const amount = Number(tx.get('amount')) || 0

          if (
            desc.includes('Adição de Crédito') ||
            (tx.getString('category') === 'health_service' && tx.getString('type') === 'credit')
          ) {
            const emp = $app.findRecordById('users', tx.getString('employee_id'))
            const curr = Number(emp.get('health_allowance')) || 0
            emp.set('health_allowance', curr + amount)
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

          try {
            let providerId = tx.getString('partner_id') || ''
            let commissionRate = 0
            let apptId = ''

            if (tx.getString('appointment_id')) {
              try {
                const appt = $app.findRecordById('appointments', tx.getString('appointment_id'))
                apptId = appt.id
                providerId = appt.getString('professional_id') || providerId
              } catch (_) {}
            }

            if (providerId) {
              try {
                const provider = $app.findRecordById('users', providerId)
                commissionRate = Number(provider.get('commission_rate')) || 0
              } catch (_) {}
            }

            if (commissionRate === 0) {
              try {
                const cfg = $app.findFirstRecordByData('configuracoes_split', 'is_active', true)
                const cat = tx.getString('category') || 'health_service'
                if (cat === 'exam') commissionRate = Number(cfg.get('exam_percentage')) || 10
                else if (cat === 'medication')
                  commissionRate = Number(cfg.get('pharmacy_percentage')) || 8
                else commissionRate = Number(cfg.get('consultation_percentage')) || 10
              } catch (_) {
                commissionRate = 10
              }
            }

            const splitAmount = (amount * commissionRate) / 100
            const logCol = $app.findCollectionByNameOrId('log_transacoes_asaas')
            const log = new Record(logCol)
            log.set('asaas_id', tx.getString('asaas_payment_id') || '')
            if (apptId) log.set('appointment_id', apptId)
            log.set('benefit_transaction_id', tx.id)
            log.set('amount', amount)
            log.set('split_amount', splitAmount)
            log.set('status', 'confirmed')
            log.set(
              'metadata',
              JSON.stringify({
                event: event,
                provider_id: providerId,
                commission_rate: commissionRate,
              }),
            )
            $app.save(log)
          } catch (err) {
            $app.logger().error('Failed to log asaas transaction', 'err', err.message)
          }
        }
      } catch (err) {
        $app.logger().warn('Webhook Tx not found', 'txId', txId)
      }
    }
  } else if (
    event === 'PAYMENT_REFUNDED' ||
    event === 'PAYMENT_CHARGEBACK_REQUESTED' ||
    event === 'PAYMENT_CHARGEBACK_DISPUTE'
  ) {
    if (txId) {
      try {
        const tx = $app.findRecordById('benefit_transactions', txId)
        tx.set('payment_status', 'refunded')
        $app.save(tx)

        const logCol = $app.findCollectionByNameOrId('log_transacoes_asaas')
        const log = new Record(logCol)
        log.set('asaas_id', tx.getString('asaas_payment_id') || '')
        log.set('benefit_transaction_id', tx.id)
        log.set('amount', Number(tx.get('amount')) || 0)
        log.set('split_amount', 0)
        log.set('status', 'refunded')
        log.set('metadata', JSON.stringify({ event: event }))
        $app.save(log)
      } catch (err) {
        $app.logger().warn('Webhook reversal Tx not found', 'txId', txId)
      }
    }
  }

  return e.json(200, { received: true })
})
