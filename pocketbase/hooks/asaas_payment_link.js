/// Generates an Asaas payment link and persists a `transacoes` record.
/// POST /backend/v1/asaas/payment-link
/// body: { valor, descricao, cliente_nome, cliente_cpf_cnpj?, data_vencimento?, metodo_pagamento }
routerAdd(
  'POST',
  '/backend/v1/asaas/payment-link',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const body = e.requestInfo().body || {}
    const valor = Number(body.valor)
    const descricao = (body.descricao || '').toString().trim()
    const clienteNome = (body.cliente_nome || '').toString().trim()
    const cpfCnpj = (body.cliente_cpf_cnpj || '').toString().replace(/\D/g, '')
    const metodoPagamento = (body.metodo_pagamento || 'PIX').toString().toUpperCase()
    let dueDate = (body.data_vencimento || '').toString()
    if (!dueDate) {
      const d = new Date(Date.now() + 3 * 86400000)
      dueDate = d.toISOString().split('T')[0]
    }

    if (!valor || valor <= 0) {
      return e.badRequestError('Valor inválido. Informe um valor maior que zero.')
    }
    if (!descricao) return e.badRequestError('Descrição é obrigatória.')
    if (!clienteNome) return e.badRequestError('Nome do cliente é obrigatório.')

    // resolve config + credentials
    let cfg
    try {
      const records = $app.findRecordsByFilter('asaas_config', '', '-created', 1, 0)
      cfg = records[0]
    } catch (_) {}
    if (!cfg) {
      const col = $app.findCollectionByNameOrId('asaas_config')
      cfg = new Record(col)
      cfg.set('api_key', '')
      cfg.set('environment', 'production')
      cfg.set(
        'webhook_url',
        'https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev/backend/v1/asaas/webhook',
      )
      cfg.set('is_active', false)
      $app.save(cfg)
    }
    const env = cfg.getString('environment') || 'production'
    let apiKey = cfg.getString('api_key') || ''
    if (!apiKey) {
      if (env === 'production') {
        apiKey = $secrets.get('ASAAS_API_KEY_PRODUCTION') || $secrets.get('ASAAS_API_KEY') || ''
      } else {
        apiKey = $secrets.get('ASAAS_API_KEY_SANDBOX') || $secrets.get('ASAAS_API_KEY') || ''
      }
    }
    const baseUrl =
      env === 'production' ? 'https://api.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3'

    if (!apiKey) {
      return e.badRequestError(
        'Asaas não configurado. Defina a API Key na tela de Configuração Asaas.',
      )
    }

    const billingType =
      metodoPagamento === 'BOLETO'
        ? 'BOLETO'
        : metodoPagamento === 'CREDIT_CARD'
          ? 'CREDIT_CARD'
          : 'PIX'

    // helper: map asaas raw status
    const mapAsaasStatus = function (rawStatus) {
      const s = (rawStatus || '').toLowerCase()
      if (s === 'received' || s === 'confirmed' || s === 'received_in_cash') return 'confirmed'
      if (s === 'pending' || s === 'awaiting' || s === 'authorized') return 'pending'
      if (s === 'overdue') return 'overdue'
      if (s === 'canceled' || s === 'cancelled' || s === 'refunded' || s === 'chargeback')
        return 'canceled'
      return 'pending'
    }

    // 1. Create or find customer
    let customerId = ''
    try {
      const custRes = $http.send({
        url: baseUrl + '/customers',
        method: 'POST',
        headers: { access_token: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clienteNome,
          cpfCnpj: cpfCnpj || undefined,
        }),
        timeout: 30,
      })
      if (custRes.statusCode === 200 && custRes.json && custRes.json.id) {
        customerId = custRes.json.id
      } else if (cpfCnpj) {
        try {
          const findRes = $http.send({
            url: baseUrl + '/customers?cpfCnpj=' + cpfCnpj,
            method: 'GET',
            headers: { access_token: apiKey },
            timeout: 30,
          })
          if (
            findRes.statusCode === 200 &&
            findRes.json &&
            findRes.json.data &&
            findRes.json.data.length
          ) {
            customerId = findRes.json.data[0].id
          }
        } catch (_) {}
      }
    } catch (err) {
      $app
        .logger()
        .error('Asaas customer create failed', 'err', (err && err.message) || String(err))
    }

    if (!customerId) {
      return e.badRequestError(
        'Não foi possível criar/localizar o cliente no Asaas. Verifique os dados informados.',
      )
    }

    // 2. Create the payment
    const paymentPayload = {
      customer: customerId,
      billingType: billingType,
      value: valor,
      dueDate: dueDate,
      description: descricao,
      externalReference: '',
    }

    let paymentId = ''
    let invoiceUrl = ''
    let paymentStatus = 'pending'
    try {
      const payRes = $http.send({
        url: baseUrl + '/payments',
        method: 'POST',
        headers: { access_token: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
        timeout: 30,
      })
      if (payRes.statusCode === 200 && payRes.json && payRes.json.id) {
        paymentId = payRes.json.id
        invoiceUrl = payRes.json.invoiceUrl || ''
        paymentStatus = mapAsaasStatus(payRes.json.status)
      } else {
        const msg =
          (payRes.json &&
            payRes.json.errors &&
            payRes.json.errors[0] &&
            payRes.json.errors[0].description) ||
          'Falha ao criar cobrança no Asaas (HTTP ' + payRes.statusCode + ').'
        return e.badRequestError(msg)
      }
    } catch (err) {
      return e.badRequestError(
        'Erro de comunicação ao criar cobrança: ' + ((err && err.message) || String(err)),
      )
    }

    // 3. Persist a `transacoes` record
    let txId = ''
    try {
      const col = $app.findCollectionByNameOrId('transacoes')
      const tx = new Record(col)
      tx.set('asaas_id', paymentId)
      tx.set('asaas_payment_id', paymentId)
      tx.set('valor', valor)
      tx.set('descricao', descricao)
      tx.set('cliente_nome', clienteNome)
      tx.set('cliente_cpf_cnpj', cpfCnpj)
      tx.set('metodo_pagamento', billingType)
      tx.set('status', paymentStatus)
      tx.set('link_pagamento', invoiceUrl)
      tx.set('invoice_url', invoiceUrl)
      tx.set('data_vencimento', dueDate)
      $app.save(tx)
      txId = tx.getId()
      // best-effort: write back externalReference to the Asaas payment
      try {
        $http.send({
          url: baseUrl + '/payments/' + paymentId,
          method: 'POST',
          headers: { access_token: apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ externalReference: txId }),
          timeout: 20,
        })
      } catch (_) {}
    } catch (err) {
      $app
        .logger()
        .error('Failed to persist transacoes record', 'err', (err && err.message) || String(err))
    }

    // audit log
    try {
      const col = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(col)
      if (user && user.getId) log.set('user_id', user.getId())
      log.set('action', 'create')
      log.set('resource_type', 'asaas_payment_link')
      log.set('resource_id', paymentId)
      log.set(
        'details',
        JSON.stringify({
          transacao_id: txId,
          valor: valor,
          cliente: clienteNome,
          metodo: billingType,
          environment: env,
        }),
      )
      $app.save(log)
    } catch (err) {
      $app.logger().warn('audit log failed', 'err', (err && err.message) || String(err))
    }

    return e.json(200, {
      success: true,
      paymentId: paymentId,
      link: invoiceUrl,
      invoiceUrl: invoiceUrl,
      valor: valor,
      metodo: billingType,
      vencimento: dueDate,
      status: paymentStatus,
      transacaoId: txId,
    })
  },
  $apis.requireAuth(),
)
