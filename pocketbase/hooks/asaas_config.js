// =====================================================
// GET /backend/v1/asaas/config
// =====================================================
routerAdd(
  'GET',
  '/backend/v1/asaas/config',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

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
    const storedKey = cfg.getString('api_key') || ''

    let maskedKey = ''
    if (storedKey) {
      maskedKey =
        storedKey.length > 10
          ? storedKey.slice(0, 4) + '••••••••' + storedKey.slice(-4)
          : '••••••••'
    }

    const webhookUrl =
      cfg.getString('webhook_url') ||
      'https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev/backend/v1/asaas/webhook'

    return e.json(200, {
      apiKey: maskedKey,
      hasApiKey: !!storedKey,
      environment: env,
      webhookUrl: webhookUrl,
      isActive: cfg.get('is_active') === true,
      lastTestedAt: cfg.getString('last_tested_at') || '',
      lastTestStatus: cfg.getString('last_test_status') || '',
    })
  },
  $apis.requireAuth(),
)

// =====================================================
// PUT /backend/v1/asaas/config
// =====================================================
routerAdd(
  'PUT',
  '/backend/v1/asaas/config',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const body = e.requestInfo().body || {}

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
    }

    const incomingKey = (body.apiKey || '').toString()
    if (incomingKey && incomingKey.indexOf('•') === -1) {
      cfg.set('api_key', incomingKey)
    }

    if (body.environment === 'sandbox' || body.environment === 'production') {
      cfg.set('environment', body.environment)
    }

    cfg.set('is_active', true)
    $app.save(cfg)

    // audit log
    try {
      const col = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(col)
      if (user && user.getId) log.set('user_id', user.getId())
      log.set('action', 'update')
      log.set('resource_type', 'asaas_config')
      log.set('resource_id', cfg.getId())
      log.set(
        'details',
        JSON.stringify({
          environment: cfg.getString('environment'),
          key_changed: !!(incomingKey && incomingKey.indexOf('•') === -1),
        }),
      )
      $app.save(log)
    } catch (err) {
      $app.logger().warn('audit log failed', 'err', (err && err.message) || String(err))
    }

    const stored = cfg.getString('api_key') || ''
    return e.json(200, {
      success: true,
      apiKey: stored ? stored.slice(0, 4) + '••••••••' + stored.slice(-4) : '',
      environment: cfg.getString('environment'),
      webhookUrl:
        cfg.getString('webhook_url') ||
        'https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev/backend/v1/asaas/webhook',
    })
  },
  $apis.requireAuth(),
)

// =====================================================
// POST /backend/v1/asaas/test-connection
// =====================================================
routerAdd(
  'POST',
  '/backend/v1/asaas/test-connection',
  (e) => {
    const user = e.auth
    if (!user) return e.unauthorizedError('Unauthorized')

    const body = e.requestInfo().body || {}

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

    const incomingKey = (body.apiKey || '').toString()
    const environment = body.environment || cfg.getString('environment') || 'production'

    let apiKey = ''
    if (incomingKey && incomingKey.indexOf('•') === -1) {
      apiKey = incomingKey
    } else {
      apiKey = cfg.getString('api_key') || ''
      if (!apiKey) {
        if (environment === 'production') {
          apiKey = $secrets.get('ASAAS_API_KEY_PRODUCTION') || $secrets.get('ASAAS_API_KEY') || ''
        } else {
          apiKey = $secrets.get('ASAAS_API_KEY_SANDBOX') || $secrets.get('ASAAS_API_KEY') || ''
        }
      }
    }

    if (!apiKey) {
      cfg.set('last_tested_at', new Date().toISOString())
      cfg.set('last_test_status', 'failed')
      $app.save(cfg)
      return e.json(200, {
        success: false,
        message: 'Nenhuma API Key configurada. Salve uma chave válida antes de testar.',
      })
    }

    const baseUrl =
      environment === 'production'
        ? 'https://api.asaas.com/api/v3'
        : 'https://sandbox.asaas.com/api/v3'

    let result
    try {
      const res = $http.send({
        url: baseUrl + '/finance/balance',
        method: 'GET',
        headers: { access_token: apiKey, 'Content-Type': 'application/json' },
        timeout: 30,
      })

      if (res.statusCode === 200) {
        cfg.set('last_tested_at', new Date().toISOString())
        cfg.set('last_test_status', 'success')
        $app.save(cfg)
        try {
          const col = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(col)
          if (user && user.getId) log.set('user_id', user.getId())
          log.set('action', 'view')
          log.set('resource_type', 'asaas_config')
          log.set('resource_id', cfg.getId())
          log.set(
            'details',
            JSON.stringify({
              action: 'test-connection',
              environment: environment,
              success: true,
            }),
          )
          $app.save(log)
        } catch (_) {}
        result = {
          success: true,
          message: 'Conectado com sucesso ao Asaas (' + environment + ').',
          balance: res.json && res.json.balance !== undefined ? res.json.balance : null,
        }
      } else {
        cfg.set('last_tested_at', new Date().toISOString())
        cfg.set('last_test_status', 'failed')
        $app.save(cfg)

        let msg = 'Falha na conexão (HTTP ' + res.statusCode + ').'
        if (res.json && res.json.errors && res.json.errors.length) {
          msg = res.json.errors[0].description || msg
        }
        try {
          const col = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(col)
          if (user && user.getId) log.set('user_id', user.getId())
          log.set('action', 'view')
          log.set('resource_type', 'asaas_config')
          log.set('resource_id', cfg.getId())
          log.set(
            'details',
            JSON.stringify({
              action: 'test-connection',
              environment: environment,
              success: false,
              statusCode: res.statusCode,
            }),
          )
          $app.save(log)
        } catch (_) {}
        result = { success: false, message: msg }
      }
    } catch (err) {
      cfg.set('last_tested_at', new Date().toISOString())
      cfg.set('last_test_status', 'failed')
      $app.save(cfg)
      try {
        const col = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(col)
        if (user && user.getId) log.set('user_id', user.getId())
        log.set('action', 'view')
        log.set('resource_type', 'asaas_config')
        log.set('resource_id', cfg.getId())
        log.set(
          'details',
          JSON.stringify({
            action: 'test-connection',
            environment: environment,
            success: false,
            error: (err && err.message) || String(err),
          }),
        )
        $app.save(log)
      } catch (_) {}
      result = {
        success: false,
        message: 'Erro de comunicação com o Asaas: ' + ((err && err.message) || String(err)),
      }
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
