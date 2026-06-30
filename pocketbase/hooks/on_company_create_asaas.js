onRecordAfterCreateSuccess((e) => {
  const record = e.record

  if (record.getString('role') !== 'company') {
    return e.next()
  }

  const API_KEY = $secrets.get('ASAAS_API_KEY') || ''
  const BASE_URL = 'https://sandbox.asaas.com/api/v3'

  if (!API_KEY) {
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('user_id', record.getId())
    log.set('action', 'create')
    log.set('resource_type', 'asaas_account')
    log.set('resource_id', record.getId())
    log.set('details', JSON.stringify({ error: 'ASAAS_API_KEY not configured', step: 'provision' }))
    $app.save(log)
    return e.next()
  }

  const name =
    record.getString('business_name') || record.getString('name') || record.getString('email')
  const taxId = (record.getString('tax_id') || '').replace(/\D/g, '')
  const email = record.getString('email')
  const phone = record.getString('phone') || record.getString('finance_contact_phone') || ''

  if (!taxId) {
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('user_id', record.getId())
    log.set('action', 'create')
    log.set('resource_type', 'asaas_account')
    log.set('resource_id', record.getId())
    log.set('details', JSON.stringify({ error: 'Missing tax_id (CNPJ)', step: 'provision' }))
    $app.save(log)
    return e.next()
  }

  const customerPayload = {
    name: name,
    email: email,
    cpfCnpj: taxId,
    phone: phone,
  }

  let customerId = ''
  let walletId = ''

  try {
    const custRes = $http.send({
      url: BASE_URL + '/customers',
      method: 'POST',
      headers: { access_token: API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(customerPayload),
      timeout: 30,
    })

    if (custRes.statusCode === 200 && custRes.json && custRes.json.id) {
      customerId = custRes.json.id

      try {
        const walletRes = $http.send({
          url: BASE_URL + '/wallets',
          method: 'POST',
          headers: { access_token: API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name + ' Wallet',
            email: email,
          }),
          timeout: 30,
        })

        if (walletRes.statusCode === 200 && walletRes.json && walletRes.json.id) {
          walletId = walletRes.json.id
        }
      } catch (walletErr) {
        $app
          .logger()
          .warn(
            'Asaas wallet creation failed',
            'companyId',
            record.getId(),
            'error',
            walletErr.message || '',
          )
      }

      const updatedRecord = $app.findRecordById('users', record.getId())
      updatedRecord.set('asaas_customer_id', customerId)
      if (walletId) {
        updatedRecord.set('asaas_wallet_id', walletId)
      }
      $app.save(updatedRecord)

      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('user_id', record.getId())
      log.set('action', 'create')
      log.set('resource_type', 'asaas_account')
      log.set('resource_id', customerId)
      log.set(
        'details',
        JSON.stringify({
          customerId: customerId,
          walletId: walletId,
          status: 'success',
        }),
      )
      $app.save(log)
    } else {
      const errorDetail = custRes.json
        ? JSON.stringify(custRes.json)
        : 'statusCode:' + custRes.statusCode

      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditCol)
      log.set('user_id', record.getId())
      log.set('action', 'create')
      log.set('resource_type', 'asaas_account')
      log.set('resource_id', record.getId())
      log.set(
        'details',
        JSON.stringify({
          error: 'Asaas customer creation failed',
          response: errorDetail,
          statusCode: custRes.statusCode,
          step: 'provision',
        }),
      )
      $app.save(log)

      $app
        .logger()
        .error(
          'Asaas company provisioning failed',
          'companyId',
          record.getId(),
          'response',
          errorDetail,
        )
    }
  } catch (err) {
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('user_id', record.getId())
    log.set('action', 'create')
    log.set('resource_type', 'asaas_account')
    log.set('resource_id', record.getId())
    log.set(
      'details',
      JSON.stringify({
        error: 'Network or transport error during Asaas provisioning',
        message: err.message || String(err),
        step: 'provision',
      }),
    )
    $app.save(log)

    $app
      .logger()
      .error(
        'Asaas provisioning transport error',
        'companyId',
        record.getId(),
        'error',
        err.message || String(err),
      )
  }

  return e.next()
}, 'users')
