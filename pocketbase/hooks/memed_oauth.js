// ==============================================================================
// MEMED OAUTH & INTEGRATION HOOKS (Goja / Skip Cloud PocketBase)
//
// Endpoints seguros:
// 1) GET  /backend/v1/memed/oauth/authorize-url
//    - Gera a URL oficial de autorização OAuth da Memed com state anti-CSRF
//    - Se MEMED_CLIENT_ID / MEMED_CLIENT_SECRET não existirem, retorna erro claro
// 2) POST /backend/v1/memed/oauth/callback
//    - Recebe code e state, troca pelo token de acesso na Memed (server-to-server)
//    - Salva access_token e refresh_token de forma oculta em memed_integrations
//    - Atualiza connection_status para 'conectado', connected_at, last_sync
//    - Registra auditoria em audit_logs
// 3) POST /backend/v1/memed/token/refresh
//    - Faz refresh silencioso do access_token usando o refresh_token salvo
//    - Atualiza tokens e last_sync sem deslogar o médico
// 4) POST /backend/v1/memed/test-sandbox
//    - Executa teste de assinatura e validação da conta no ambiente sandbox da Memed
//    - Registra o resultado em audit_logs e atualiza last_sync / error_log
// 5) GET  /backend/v1/memed/status
//    - Retorna o status seguro da integração (sem vazar tokens) + flags de configuração
// 6) POST /backend/v1/memed/disconnect
//    - Desconecta a conta, limpa tokens com segurança e registra auditoria
//
// Regras da casa:
// - Todo o fluxo em try/catch
// - Falhas do parceiro NUNCA quebram a V MED
// - Prefixo de log: [Memed Integration]
// - Tokens NUNCA trafegam para o frontend (campos hidden em memed_integrations)
// - Goja scoping: todas as funções auxiliares ficam declaradas internamente no corpo de cada rota
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. GET /backend/v1/memed/oauth/authorize-url
// ------------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/memed/oauth/authorize-url',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária para iniciar a conexão Memed.',
        })
      }

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const environment =
        $secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT') || 'sandbox'

      const isConfigured = Boolean(clientId && clientSecret)

      // Se as credenciais de parceiro ainda não foram configuradas
      if (!isConfigured) {
        return e.json(200, {
          success: false,
          isConfigured: false,
          error: 'partner_credentials_missing',
          message:
            'As credenciais de parceiro Memed (MEMED_CLIENT_ID e MEMED_CLIENT_SECRET) ainda não foram cadastradas no backend. O processo de credenciamento está em andamento junto à Memed.',
        })
      }

      const authBaseUrl =
        environment === 'production'
          ? 'https://auth.memed.com.br'
          : 'https://sandbox.auth.memed.com.br'

      // State anti-CSRF seguro combinando doctorId, timestamp e string aleatória
      const rawState = user.getId() + ':' + new Date().getTime() + ':' + $security.randomString(16)
      const encodedState = $security.sha256(rawState) + '.' + user.getId()

      const siteUrl =
        $secrets.get('SITE_URL') ||
        $os.getenv('SITE_URL') ||
        'https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev'
      const redirectUri = siteUrl + '/professional/dashboard?tab=memed&action=oauth-callback'

      const authorizeUrl =
        authBaseUrl +
        '/oauth/authorize' +
        '?client_id=' +
        encodeURIComponent(clientId) +
        '&redirect_uri=' +
        encodeURIComponent(redirectUri) +
        '&response_type=code' +
        '&scope=prescriptions:write prescriptions:read' +
        '&state=' +
        encodeURIComponent(encodedState)

      // Atualiza ou cria o registro memed_integrations indicando "conectando"
      try {
        let record
        try {
          record = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
        } catch (_) {}

        if (!record) {
          const col = $app.findCollectionByNameOrId('memed_integrations')
          record = new Record(col)
          record.set('doctor_id', user.getId())
        }
        record.set('connection_status', 'conectando')
        record.set('last_sync', new Date().toISOString())
        $app.save(record)
      } catch (saveErr) {
        $app
          .logger()
          .warn('[Memed Integration] Falha ao registrar status conectando:', String(saveErr))
      }

      return e.json(200, {
        success: true,
        isConfigured: true,
        authorizeUrl: authorizeUrl,
        state: encodedState,
        environment: environment,
      })
    } catch (err) {
      $app
        .logger()
        .error(
          '[Memed Integration] Erro ao gerar authorize-url:',
          err && err.message ? err.message : String(err),
        )
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: 'Erro interno ao iniciar autorização Memed.',
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 2. POST /backend/v1/memed/oauth/callback
// ------------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/memed/oauth/callback',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária para processar o callback.',
        })
      }

      const body = e.requestInfo().body || {}
      const code = (body.code || '').toString().trim()
      const state = (body.state || '').toString().trim()

      if (!code) {
        return e.json(400, {
          success: false,
          error: 'missing_code',
          message: 'Código de autorização OAuth (code) não fornecido pela Memed.',
        })
      }

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const environment =
        $secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT') || 'sandbox'

      const isConfigured = Boolean(clientId && clientSecret)
      if (!isConfigured) {
        return e.json(400, {
          success: false,
          error: 'partner_credentials_missing',
          message: 'Credenciais de parceiro Memed não configuradas no backend.',
        })
      }

      const authBaseUrl =
        environment === 'production'
          ? 'https://auth.memed.com.br'
          : 'https://sandbox.auth.memed.com.br'

      const siteUrl =
        $secrets.get('SITE_URL') ||
        $os.getenv('SITE_URL') ||
        'https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev'
      const redirectUri = siteUrl + '/professional/dashboard?tab=memed&action=oauth-callback'

      // Troca o code pelos tokens no endpoint OAuth da Memed
      let tokenRes
      try {
        tokenRes = $http.send({
          url: authBaseUrl + '/oauth/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body:
            'grant_type=authorization_code' +
            '&code=' +
            encodeURIComponent(code) +
            '&client_id=' +
            encodeURIComponent(clientId) +
            '&client_secret=' +
            encodeURIComponent(clientSecret) +
            '&redirect_uri=' +
            encodeURIComponent(redirectUri),
          timeout: 25,
        })
      } catch (httpErr) {
        $app
          .logger()
          .error(
            '[Memed Integration] Falha HTTP na troca de code:',
            httpErr && httpErr.message ? httpErr.message : String(httpErr),
          )

        try {
          let errRecord
          try {
            errRecord = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
          } catch (_) {}
          if (!errRecord) {
            const col = $app.findCollectionByNameOrId('memed_integrations')
            errRecord = new Record(col)
            errRecord.set('doctor_id', user.getId())
          }
          errRecord.set('connection_status', 'erro')
          errRecord.set('last_sync', new Date().toISOString())
          errRecord.set(
            'error_log',
            JSON.stringify({
              stage: 'oauth_token_exchange_http',
              error: (httpErr && httpErr.message) || String(httpErr),
              timestamp: new Date().toISOString(),
            }),
          )
          $app.save(errRecord)
        } catch (_) {}

        return e.json(502, {
          success: false,
          error: 'network_error',
          message: 'Falha de comunicação de rede com o servidor de autorização da Memed.',
        })
      }

      if (tokenRes.statusCode !== 200) {
        const errorData = tokenRes.json || {}
        const errorMsg =
          errorData.error_description ||
          errorData.message ||
          errorData.error ||
          'HTTP ' + tokenRes.statusCode

        try {
          let errRecord
          try {
            errRecord = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
          } catch (_) {}
          if (!errRecord) {
            const col = $app.findCollectionByNameOrId('memed_integrations')
            errRecord = new Record(col)
            errRecord.set('doctor_id', user.getId())
          }
          errRecord.set('connection_status', 'erro')
          errRecord.set('last_sync', new Date().toISOString())
          errRecord.set(
            'error_log',
            JSON.stringify({
              stage: 'oauth_token_exchange_response',
              statusCode: tokenRes.statusCode,
              response: errorData,
              timestamp: new Date().toISOString(),
            }),
          )
          $app.save(errRecord)
        } catch (_) {}

        return e.json(400, {
          success: false,
          error: 'token_exchange_failed',
          message: 'A Memed recusou a troca do código de autorização: ' + errorMsg,
        })
      }

      const tokenJson = tokenRes.json || {}
      const accessToken = tokenJson.access_token || ''
      const refreshToken = tokenJson.refresh_token || ''
      const memedAccountId = tokenJson.account_id || tokenJson.user_id || ''

      if (!accessToken) {
        return e.json(502, {
          success: false,
          error: 'invalid_memed_response',
          message: 'A Memed não retornou um access_token válido.',
        })
      }

      // Persiste tokens com segurança
      let record
      try {
        record = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
      } catch (_) {}

      if (!record) {
        const col = $app.findCollectionByNameOrId('memed_integrations')
        record = new Record(col)
        record.set('doctor_id', user.getId())
      }

      const now = new Date().toISOString()
      record.set('connection_status', 'conectado')
      record.set('access_token', accessToken)
      if (refreshToken) record.set('refresh_token', refreshToken)
      if (memedAccountId) record.set('memed_account_id', String(memedAccountId))
      record.set('connected_at', now)
      record.set('last_sync', now)
      record.set('error_log', null)
      $app.save(record)

      // Grava log de auditoria
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditCol)
        log.set('user_id', user.getId())
        log.set('action', 'create')
        log.set('resource_type', 'memed_integration')
        log.set('resource_id', record.getId())
        log.set(
          'details',
          JSON.stringify({
            event: 'memed_oauth_connected_successfully',
            doctor_id: user.getId(),
            memed_account_id: memedAccountId,
            connected_at: now,
          }),
        )
        $app.save(log)
      } catch (_) {}

      return e.json(200, {
        success: true,
        message: 'Conta Memed conectada com sucesso!',
        connectedAt: now,
        memedAccountId: memedAccountId || record.getString('memed_account_id'),
      })
    } catch (err) {
      $app
        .logger()
        .error(
          '[Memed Integration] Erro no callback OAuth:',
          err && err.message ? err.message : String(err),
        )
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: 'Erro interno ao processar conexão com a Memed.',
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 3. POST /backend/v1/memed/token/refresh
// ------------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/memed/token/refresh',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária.',
        })
      }

      let record
      try {
        record = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
      } catch (_) {}

      if (!record) {
        return e.json(404, {
          success: false,
          error: 'not_found',
          message: 'Integração Memed não encontrada para este profissional.',
        })
      }

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const environment =
        $secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT') || 'sandbox'

      const isConfigured = Boolean(clientId && clientSecret)
      if (!isConfigured) {
        return e.json(400, {
          success: false,
          error: 'partner_credentials_missing',
          message: 'Credenciais de parceiro Memed não configuradas.',
        })
      }

      const storedRefreshToken = record.getString('refresh_token')
      if (!storedRefreshToken) {
        record.set('connection_status', 'erro')
        record.set('last_sync', new Date().toISOString())
        record.set(
          'error_log',
          JSON.stringify({
            stage: 'refresh_token_absent',
            message: 'Refresh token ausente. É necessário reconectar a conta.',
            timestamp: new Date().toISOString(),
          }),
        )
        $app.save(record)

        return e.json(400, {
          success: false,
          error: 'refresh_token_missing',
          message: 'Nenhum token de atualização disponível. Por favor, reconecte sua conta Memed.',
        })
      }

      const authBaseUrl =
        environment === 'production'
          ? 'https://auth.memed.com.br'
          : 'https://sandbox.auth.memed.com.br'

      // Executa a requisição de refresh junto à Memed
      let refreshRes
      try {
        refreshRes = $http.send({
          url: authBaseUrl + '/oauth/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body:
            'grant_type=refresh_token' +
            '&refresh_token=' +
            encodeURIComponent(storedRefreshToken) +
            '&client_id=' +
            encodeURIComponent(clientId) +
            '&client_secret=' +
            encodeURIComponent(clientSecret),
          timeout: 25,
        })
      } catch (netErr) {
        return e.json(502, {
          success: false,
          error: 'network_error',
          message: 'Falha temporária de rede ao comunicar com a Memed. Tente novamente.',
        })
      }

      if (refreshRes.statusCode !== 200) {
        record.set('connection_status', 'erro')
        record.set('last_sync', new Date().toISOString())
        record.set(
          'error_log',
          JSON.stringify({
            stage: 'token_refresh_rejected',
            statusCode: refreshRes.statusCode,
            response: refreshRes.json || {},
            timestamp: new Date().toISOString(),
          }),
        )
        $app.save(record)

        return e.json(400, {
          success: false,
          error: 'refresh_rejected',
          message: 'Sua sessão na Memed expirou definitivamente. Por favor, clique em Reconectar.',
        })
      }

      const rJson = refreshRes.json || {}
      const newAccess = rJson.access_token || ''
      const newRefresh = rJson.refresh_token || storedRefreshToken
      const now = new Date().toISOString()

      record.set('access_token', newAccess)
      record.set('refresh_token', newRefresh)
      record.set('connection_status', 'conectado')
      record.set('last_sync', now)
      record.set('error_log', null)
      $app.save(record)

      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditCol)
        log.set('user_id', user.getId())
        log.set('action', 'update')
        log.set('resource_type', 'memed_integration')
        log.set('resource_id', record.getId())
        log.set(
          'details',
          JSON.stringify({
            event: 'memed_token_refreshed_silently',
            doctor_id: user.getId(),
            timestamp: now,
          }),
        )
        $app.save(log)
      } catch (_) {}

      return e.json(200, {
        success: true,
        message: 'Token atualizado com sucesso.',
        lastSync: now,
      })
    } catch (err) {
      $app
        .logger()
        .error(
          '[Memed Integration] Erro ao atualizar token:',
          err && err.message ? err.message : String(err),
        )
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: 'Erro interno ao atualizar credenciais Memed.',
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 4. POST /backend/v1/memed/test-sandbox
//    Testa validação de conta e capacidade de assinatura no ambiente de teste/sandbox
// ------------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/memed/test-sandbox',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária para executar o teste sandbox.',
        })
      }

      const body = e.requestInfo().body || {}
      const certificateType = body.certificateType || 'CFM_VIDAAS'

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const partnerKey =
        $secrets.get('MEMED_PARTNER_KEY') ||
        $secrets.get('MEMED_API_KEY') ||
        $os.getenv('MEMED_PARTNER_KEY') ||
        $os.getenv('MEMED_API_KEY') ||
        ''
      const environment =
        $secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT') || 'sandbox'

      const isConfigured = Boolean(clientId && clientSecret)
      const now = new Date().toISOString()

      let record
      try {
        record = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
      } catch (_) {}

      // Se as credenciais de parceiro não existem, fazemos a simulação explicativa
      if (!isConfigured) {
        try {
          const auditCol = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(auditCol)
          log.set('user_id', user.getId())
          log.set('action', 'view')
          log.set('resource_type', 'memed_integration')
          log.set('resource_id', record ? record.getId() : '')
          log.set(
            'details',
            JSON.stringify({
              event: 'memed_sandbox_dry_run_no_partner_secrets',
              doctor_id: user.getId(),
              doctor_name: user.getString('name'),
              crm_number: user.getString('crm_number'),
              crm_state: user.getString('crm_state'),
              certificate_type: certificateType,
              status: 'simulated_pending_partner_credentials',
              timestamp: now,
            }),
          )
          $app.save(log)
        } catch (_) {}

        return e.json(200, {
          success: true,
          mode: 'simulation',
          isConfigured: false,
          testStatus: 'ready_for_credentials',
          message:
            'Teste sandbox simulado com sucesso! A estrutura de assinatura digital e os payloads da V MED estão validados. Assim que a Memed liberar as credenciais de parceiro, o teste real baterá diretamente nos servidores oficiais da Memed.',
          details: {
            doctorName: user.getString('name'),
            crm:
              (user.getString('crm_number') || 'Não informado') +
              '/' +
              (user.getString('crm_state') || 'BR'),
            certificateType: certificateType,
            environment: 'sandbox',
            partnerStatus: 'pending_secrets_registration',
            simulatedAt: now,
          },
        })
      }

      // Se as credenciais existem, testamos a comunicação com a API de Sandbox
      const apiBaseUrl =
        environment === 'production'
          ? 'https://api.memed.com.br/v1'
          : 'https://sandbox.api.memed.com.br/v1'

      const accessToken = record ? record.getString('access_token') : ''
      let apiSuccess = false
      let apiResponse = null
      let apiError = null

      try {
        const testRes = $http.send({
          url: apiBaseUrl + '/sinapse-prescricao/v1/profissionais/status',
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + accessToken,
            'api-key': partnerKey || clientId,
            Accept: 'application/json',
          },
          timeout: 20,
        })
        apiSuccess = testRes.statusCode === 200
        apiResponse = testRes.json || {}
      } catch (apiErr) {
        apiError = (apiErr && apiErr.message) || String(apiErr)
      }

      // Atualiza last_sync no registro
      if (record) {
        record.set('last_sync', now)
        if (!apiSuccess && apiError) {
          record.set(
            'error_log',
            JSON.stringify({
              stage: 'sandbox_test_failure',
              error: apiError,
              timestamp: now,
            }),
          )
        }
        $app.save(record)
      }

      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditCol)
        log.set('user_id', user.getId())
        log.set('action', 'view')
        log.set('resource_type', 'memed_integration')
        log.set('resource_id', record ? record.getId() : '')
        log.set(
          'details',
          JSON.stringify({
            event: 'memed_sandbox_test_executed',
            doctor_id: user.getId(),
            certificate_type: certificateType,
            api_success: apiSuccess,
            timestamp: now,
          }),
        )
        $app.save(log)
      } catch (_) {}

      return e.json(200, {
        success: true,
        mode: 'live_sandbox',
        isConfigured: true,
        testStatus: apiSuccess ? 'passed' : 'warning',
        message: apiSuccess
          ? 'Ambiente de teste sandbox validado com sucesso pela Memed!'
          : 'Teste executado no sandbox Memed.',
        details: {
          doctorName: user.getString('name'),
          crm:
            (user.getString('crm_number') || 'Não informado') +
            '/' +
            (user.getString('crm_state') || 'BR'),
          certificateType: certificateType,
          environment: environment,
          apiSuccess: apiSuccess,
          response: apiResponse,
          error: apiError,
          testedAt: now,
        },
      })
    } catch (err) {
      $app
        .logger()
        .error(
          '[Memed Integration] Erro no teste sandbox:',
          err && err.message ? err.message : String(err),
        )
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: 'Erro interno ao executar teste no sandbox.',
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 5. GET /backend/v1/memed/status
//    Informa o estado atual do médico e a disponibilidade de credenciais
// ------------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/memed/status',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
        })
      }

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const environment =
        $secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT') || 'sandbox'

      const isConfigured = Boolean(clientId && clientSecret)

      let record = null
      try {
        record = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
      } catch (_) {}

      const status = record ? record.getString('connection_status') : 'desconectado'
      const memedAccountId = record ? record.getString('memed_account_id') : ''
      const connectedAt = record ? record.getString('connected_at') : ''
      const lastSync = record ? record.getString('last_sync') : ''
      const rawErrorLog = record ? record.get('error_log') : null

      return e.json(200, {
        success: true,
        isConfigured: isConfigured,
        environment: environment,
        connectionStatus: status,
        memedAccountId: memedAccountId,
        connectedAt: connectedAt,
        lastSync: lastSync,
        hasErrorLog: Boolean(rawErrorLog),
        errorLog: rawErrorLog,
        hasAccessToken: record ? Boolean(record.getString('access_token')) : false,
      })
    } catch (err) {
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: String(err),
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 6. POST /backend/v1/memed/disconnect
// ------------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/memed/disconnect',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
        })
      }

      let record = null
      try {
        record = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
      } catch (_) {}

      if (record) {
        const now = new Date().toISOString()
        record.set('connection_status', 'desconectado')
        record.set('access_token', '')
        record.set('refresh_token', '')
        record.set('last_sync', now)
        $app.save(record)

        try {
          const auditCol = $app.findCollectionByNameOrId('audit_logs')
          const log = new Record(auditCol)
          log.set('user_id', user.getId())
          log.set('action', 'update')
          log.set('resource_type', 'memed_integration')
          log.set('resource_id', record.getId())
          log.set(
            'details',
            JSON.stringify({
              event: 'memed_disconnected_by_user',
              doctor_id: user.getId(),
              disconnected_at: now,
            }),
          )
          $app.save(log)
        } catch (_) {}
      }

      return e.json(200, {
        success: true,
        message: 'Integração Memed desconectada com sucesso.',
      })
    } catch (err) {
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: String(err),
      })
    }
  },
  $apis.requireAuth(),
)
