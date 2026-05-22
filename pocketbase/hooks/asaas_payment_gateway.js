routerAdd(
  'POST',
  '/backend/v1/asaas/pay',
  (e) => {
    const body = e.requestInfo().body
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const API_KEY = $secrets.get('ASAAS_API_KEY') || ''
    const BASE_URL = 'https://sandbox.asaas.com/api/v3'

    let customerId = user.getString('asaas_customer_id')
    if (!customerId) {
      if (API_KEY) {
        const custRes = $http.send({
          url: BASE_URL + '/customers',
          method: 'POST',
          headers: { access_token: API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:
              user.getString('name') || user.getString('business_name') || user.getString('email'),
            email: user.getString('email'),
            cpfCnpj: user.getString('document_id') || user.getString('tax_id') || '00000000000',
          }),
        })
        if (custRes.statusCode === 200 && custRes.json.id) {
          customerId = custRes.json.id
          user.set('asaas_customer_id', customerId)
          $app.save(user)
        } else {
          $app.logger().error('Asaas Customer Error', 'response', JSON.stringify(custRes.json))
          // Fallback for demo if API_KEY is invalid/missing or CPF is invalid
          customerId = 'cus_mock_' + $security.randomString(8)
          user.set('asaas_customer_id', customerId)
          $app.save(user)
        }
      } else {
        // Mock mode
        customerId = 'cus_mock_' + $security.randomString(8)
        user.set('asaas_customer_id', customerId)
        $app.save(user)
      }
    }

    const payload = {
      customer: customerId,
      billingType: body.billingType || 'PIX',
      value: body.amount,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      description: body.description,
      externalReference: body.transactionId,
    }

    if (body.split && body.split.walletId) {
      payload.split = [
        {
          walletId: body.split.walletId,
          percentualValue: body.split.percentage,
        },
      ]
    }

    let payResId = 'pay_mock_' + $security.randomString(8)
    let invoiceUrl = 'https://sandbox.asaas.com/i/' + payResId
    let pixData = { encodedImage: 'mock_base64', payload: '00020101021226...mock_pix_code' }

    if (API_KEY && !customerId.startsWith('cus_mock_')) {
      const payRes = $http.send({
        url: BASE_URL + '/payments',
        method: 'POST',
        headers: { access_token: API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (payRes.statusCode === 200) {
        payResId = payRes.json.id
        invoiceUrl = payRes.json.invoiceUrl

        if (payload.billingType === 'PIX') {
          const pixRes = $http.send({
            url: BASE_URL + `/payments/${payResId}/pixQrCode`,
            method: 'GET',
            headers: { access_token: API_KEY },
          })
          if (pixRes.statusCode === 200) {
            pixData = pixRes.json
          }
        }
      } else {
        $app.logger().error('Asaas Payment Error', 'response', JSON.stringify(payRes.json))
        return e.badRequestError(
          'Payment failed: ' + (payRes.json?.errors?.[0]?.description || 'Error'),
        )
      }
    }

    if (body.transactionId) {
      try {
        const tx = $app.findRecordById('benefit_transactions', body.transactionId)
        tx.set('asaas_payment_id', payResId)
        tx.set('payment_status', 'pending')
        $app.save(tx)
      } catch (err) {
        $app.logger().warn('Tx not found for payment', 'txId', body.transactionId)
      }
    }

    return e.json(200, { paymentId: payResId, invoiceUrl, pix: pixData })
  },
  $apis.requireAuth(),
)
