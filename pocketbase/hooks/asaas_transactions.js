// =====================================================
// GET /backend/v1/asaas/transactions
// Query params: page, perPage, status, startDate, endDate, search
// =====================================================
routerAdd(
  'GET',
  '/backend/v1/asaas/transactions',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const q = e.requestInfo().query || {}
    let page = parseInt(q.page || '1', 10)
    if (!page || page < 1) page = 1
    let perPage = parseInt(q.perPage || '10', 10)
    if (!perPage || perPage < 1) perPage = 10
    if (perPage > 100) perPage = 100

    const filters = []
    if (q.status && q.status !== 'all' && q.status !== 'Todos') {
      filters.push("status = '" + q.status + "'")
    }
    if (q.startDate) {
      filters.push("created >= '" + q.startDate + " 00:00:00'")
    }
    if (q.endDate) {
      filters.push("created <= '" + q.endDate + " 23:59:59'")
    }
    if (q.search) {
      const term = q.search.replace(/'/g, "\\'")
      filters.push("cliente_nome ~ '" + term + "'")
    }
    const filterStr = filters.join(' && ')

    let total = 0
    try {
      const whereParts = []
      const params = {}
      if (q.status && q.status !== 'all' && q.status !== 'Todos') {
        whereParts.push('status = {:status}')
        params.status = q.status
      }
      if (q.startDate) {
        whereParts.push('created >= {:start}')
        params.start = q.startDate + ' 00:00:00'
      }
      if (q.endDate) {
        whereParts.push('created <= {:end}')
        params.end = q.endDate + ' 23:59:59'
      }
      if (q.search) {
        whereParts.push('cliente_nome LIKE {:search}')
        params.search = '%' + q.search + '%'
      }
      const whereSql = whereParts.length ? ' WHERE ' + whereParts.join(' AND ') : ''
      const countRow = $app
        .db()
        .newQuery('SELECT COUNT(*) as cnt FROM transacoes' + whereSql)
        .bind(params)
        .one()
      total = countRow.cnt
    } catch (err) {
      $app.logger().warn('count failed', 'err', (err && err.message) || String(err))
    }

    let items = []
    try {
      const res = $app.findRecordsByFilter(
        'transacoes',
        filterStr,
        '-created',
        perPage,
        (page - 1) * perPage,
      )
      items = res.map(function (r) {
        return {
          id: r.getId(),
          asaas_id: r.getString('asaas_id'),
          asaas_payment_id: r.getString('asaas_payment_id'),
          valor: Number(r.get('valor')) || 0,
          descricao: r.getString('descricao'),
          cliente_nome: r.getString('cliente_nome'),
          cliente_cpf_cnpj: r.getString('cliente_cpf_cnpj'),
          metodo_pagamento: r.getString('metodo_pagamento'),
          status: r.getString('status'),
          link_pagamento: r.getString('link_pagamento'),
          invoice_url: r.getString('invoice_url'),
          data_vencimento: r.getString('data_vencimento'),
          created: r.getString('created'),
          updated: r.getString('updated'),
        }
      })
    } catch (err) {
      return e.json(500, {
        error: 'Erro ao listar transações',
        message: (err && err.message) || String(err),
      })
    }

    const totalPages = Math.max(1, Math.ceil(total / perPage))
    return e.json(200, {
      items: items,
      page: page,
      perPage: perPage,
      totalItems: total,
      totalPages: totalPages,
    })
  },
  $apis.requireAuth(),
)

// =====================================================
// POST /backend/v1/asaas/transaction/{id}/consult
// =====================================================
routerAdd(
  'POST',
  '/backend/v1/asaas/transaction/{id}/consult',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const id = e.request.pathValue('id')
    let record
    try {
      record = $app.findRecordById('transacoes', id)
    } catch (_) {
      return e.notFoundError('Transação não encontrada.')
    }

    const asaasId = record.getString('asaas_id') || record.getString('asaas_payment_id')
    if (!asaasId) {
      return e.badRequestError('Transação sem ID Asaas vinculado.')
    }

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
      return e.badRequestError('Asaas não configurado.')
    }

    const mapAsaasStatus = function (rawStatus) {
      const s = (rawStatus || '').toLowerCase()
      if (s === 'received' || s === 'confirmed' || s === 'received_in_cash') return 'confirmed'
      if (s === 'pending' || s === 'awaiting' || s === 'authorized') return 'pending'
      if (s === 'overdue') return 'overdue'
      if (s === 'canceled' || s === 'cancelled' || s === 'refunded' || s === 'chargeback')
        return 'canceled'
      return 'pending'
    }

    try {
      const res = $http.send({
        url: baseUrl + '/payments/' + asaasId,
        method: 'GET',
        headers: { access_token: apiKey },
        timeout: 30,
      })
      if (res.statusCode === 200 && res.json) {
        const asaasRawStatus = res.json.status || ''
        const newStatus = mapAsaasStatus(asaasRawStatus)
        record.set('status', newStatus)
        if (res.json.invoiceUrl) {
          record.set('link_pagamento', res.json.invoiceUrl)
          record.set('invoice_url', res.json.invoiceUrl)
        }
        $app.save(record)
        try {
          const col = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(col)
          if (user && user.getId) log.set('user_id', user.getId())
          log.set('action', 'update')
          log.set('resource_type', 'asaas_transaction_consult')
          log.set('resource_id', asaasId)
          log.set(
            'details',
            JSON.stringify({
              transacao_id: id,
              asaas_status: asaasRawStatus,
              internal_status: newStatus,
              environment: env,
            }),
          )
          $app.save(log)
        } catch (_) {}
        return e.json(200, {
          success: true,
          status: newStatus,
          asaasStatus: asaasRawStatus,
          message: 'Status atualizado com sucesso.',
        })
      } else {
        try {
          const col = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(col)
          if (user && user.getId) log.set('user_id', user.getId())
          log.set('action', 'update')
          log.set('resource_type', 'asaas_transaction_consult')
          log.set('resource_id', asaasId)
          log.set(
            'details',
            JSON.stringify({
              transacao_id: id,
              success: false,
              statusCode: res.statusCode,
            }),
          )
          $app.save(log)
        } catch (_) {}
        return e.json(200, {
          success: false,
          message: 'Falha ao consultar Asaas (HTTP ' + res.statusCode + ').',
        })
      }
    } catch (err) {
      return e.json(500, {
        success: false,
        message: 'Erro de comunicação: ' + ((err && err.message) || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)

// =====================================================
// POST /backend/v1/asaas/transaction/{id}/cancel
// =====================================================
routerAdd(
  'POST',
  '/backend/v1/asaas/transaction/{id}/cancel',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const id = e.request.pathValue('id')
    let record
    try {
      record = $app.findRecordById('transacoes', id)
    } catch (_) {
      return e.notFoundError('Transação não encontrada.')
    }

    const currentStatus = record.getString('status')
    if (currentStatus !== 'pending') {
      return e.badRequestError(
        'Apenas cobranças pendentes podem ser canceladas. Status atual: ' + currentStatus,
      )
    }

    const asaasId = record.getString('asaas_id') || record.getString('asaas_payment_id')
    if (!asaasId) {
      return e.badRequestError('Transação sem ID Asaas vinculado.')
    }

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
      return e.badRequestError('Asaas não configurado.')
    }

    try {
      const res = $http.send({
        url: baseUrl + '/payments/' + asaasId,
        method: 'DELETE',
        headers: { access_token: apiKey },
        timeout: 30,
      })
      if (res.statusCode === 200 || res.statusCode === 204) {
        record.set('status', 'canceled')
        $app.save(record)
        try {
          const col = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(col)
          if (user && user.getId) log.set('user_id', user.getId())
          log.set('action', 'delete')
          log.set('resource_type', 'asaas_transaction_cancel')
          log.set('resource_id', asaasId)
          log.set(
            'details',
            JSON.stringify({
              transacao_id: id,
              environment: env,
            }),
          )
          $app.save(log)
        } catch (_) {}
        return e.json(200, {
          success: true,
          status: 'canceled',
          message: 'Cobrança cancelada com sucesso.',
        })
      } else {
        let msg = 'Falha ao cancelar no Asaas (HTTP ' + res.statusCode + ').'
        if (res.json && res.json.errors && res.json.errors.length) {
          msg = res.json.errors[0].description || msg
        }
        return e.json(200, { success: false, message: msg })
      }
    } catch (err) {
      return e.json(500, {
        success: false,
        message: 'Erro de comunicação: ' + ((err && err.message) || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
