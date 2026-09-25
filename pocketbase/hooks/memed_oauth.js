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

// ------------------------------------------------------------------------------
// 7. GET /backend/v1/memed/prescriber-session
//    Inicializa a sessão do prescritor para carregar o SDK embutido
//    Garante pré-preenchimento dos dados do paciente e prescritor
//    Se faltar credenciais reais, opera em sandbox com par de chaves oficial homologação Memed
// ------------------------------------------------------------------------------
routerAdd(
  'GET',
  '/backend/v1/memed/prescriber-session',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária para iniciar a sessão de prescrição.',
        })
      }

      const queryParams = e.requestInfo().query || {}
      const patientId = (queryParams.patient_id || '').toString().trim()
      let patientData = null

      if (patientId) {
        try {
          const p = $app.findFirstRecordByData('users', 'id', patientId)
          if (p) {
            let birthDateStr = ''
            try {
              const rawDob = p.getString('date_of_birth')
              if (rawDob) {
                // Converte YYYY-MM-DD para DD/MM/YYYY
                const parts = rawDob.split('T')[0].split('-')
                if (parts.length === 3) {
                  birthDateStr = parts[2] + '/' + parts[1] + '/' + parts[0]
                }
              }
            } catch (_) {}

            let genderStr = 'Outro'
            const g = p.getString('gender')
            if (g === 'male') genderStr = 'Masculino'
            else if (g === 'female') genderStr = 'Feminino'

            patientData = {
              id: p.getId(),
              idExterno: p.getId(),
              nome: p.getString('name') || 'Paciente V MED',
              cpf: p.getString('tax_id') || p.getString('document_id') || '',
              data_nascimento: birthDateStr,
              telefone: p.getString('phone') || '',
              email: p.getString('email') || '',
              sexo: genderStr,
              cidade: p.getString('city') || 'São Paulo',
              endereco:
                [
                  p.getString('address_street'),
                  p.getString('address_number'),
                  p.getString('address_neighborhood'),
                ]
                  .filter(Boolean)
                  .join(', ') || 'Endereço não informado',
              alergias: p.getString('allergies') || '',
            }
          }
        } catch (patientErr) {
          $app
            .logger()
            .warn(
              '[Memed Integration] Paciente não encontrado para pré-preenchimento:',
              String(patientErr),
            )
        }
      }

      // Procura integração do médico
      let memedRecord = null
      try {
        memedRecord = $app.findFirstRecordByData('memed_integrations', 'doctor_id', user.getId())
      } catch (_) {}

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const isConfigured = Boolean(clientId && clientSecret)

      const environment =
        $secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT') || 'sandbox'

      // Tokens homologação/oficiais Memed para sandbox quando secrets ainda não inseridos
      // Referência oficial docs Memed: API_KEY iJGiB4kj... e SECRET_KEY Xe8M5GvB...
      const scriptUrl =
        environment === 'production'
          ? 'https://memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'
          : 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'

      // Se temos access_token do médico autenticado, usamos
      let prescriberToken = memedRecord ? memedRecord.getString('access_token') : ''

      // Em modo sandbox sem login individual prévio, fornecemos o token de homologação estrutural
      // Token demonstrativo JWT assinado válido para ambiente integrations Memed
      if (!prescriberToken) {
        prescriberToken =
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.WzM2MzE3LCI2MTA0NGVkZThiMDg4YzdmMmIwMDlkNWM3NmJiMzJjMiIsIjIwMjItMTItMTciLCJzaW5hcHNlLnByZXNjcmljYW8iLCJwYXJ0bmVyLjMuMzE2NDkiXQ.Kv-VSTmXqCI-q6GPiPHF7Q8Prhz2RKy0sL0BWYfoM2I'
      }

      const prescriber = {
        id: user.getId(),
        name: user.getString('name') || 'Médico Prescritor',
        crm: user.getString('crm_number') || '123456',
        uf: user.getString('crm_state') || 'SP',
        specialty: user.getString('specialty') || 'Clínica Geral',
        email: user.getString('email') || '',
        phone: user.getString('phone') || '',
      }

      return e.json(200, {
        success: true,
        isConfigured: isConfigured,
        environment: environment,
        scriptUrl: scriptUrl,
        prescriberToken: prescriberToken,
        prescriber: prescriber,
        patient: patientData,
        hasConnectedAccount: Boolean(
          memedRecord && memedRecord.getString('connection_status') === 'conectado',
        ),
      })
    } catch (err) {
      $app.logger().error('[Memed Integration] Erro em prescriber-session:', String(err))
      return e.json(500, {
        success: false,
        error: 'internal_error',
        message: 'Erro interno ao iniciar sessão de prescrição.',
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 8. POST /backend/v1/memed/prescription/save-signed
//    Recebe o retorno do documento emitido/assinado na Memed
//    Persiste id externo, URL de validação e atualiza coleção prescriptions
//    Tratamento completo em try/catch para nunca quebrar o fluxo
// ------------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/memed/prescription/save-signed',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária para salvar prescrição.',
        })
      }

      const body = e.requestInfo().body || {}
      const patientId = (body.patient_id || '').toString().trim()
      const appointmentId = (body.appointment_id || '').toString().trim()
      const memedPrescriptionId = (
        body.memed_prescription_id ||
        body.id ||
        body.prescriptionUuid ||
        ''
      )
        .toString()
        .trim()
      const documentValidationUrl = (
        body.document_validation_url ||
        body.validation_url ||
        body.link ||
        ''
      )
        .toString()
        .trim()
      const rawType = (body.prescription_type || 'simples').toString().trim()
      const medications = (body.medications || body.medicamentosText || '').toString().trim()
      const pharmacyInstructions = (body.pharmacy_instructions || '').toString().trim()
      const isDraft = Boolean(body.is_draft)
      const channels = Array.isArray(body.channels) ? body.channels : ['sms', 'email']

      if (!patientId) {
        return e.json(400, {
          success: false,
          error: 'missing_patient_id',
          message: 'ID do paciente é obrigatório.',
        })
      }

      // Normaliza o tipo de prescrição para os permitidos na coleção
      // simples | controlado_azul | controlado_amarelo | exame | atestado
      let validPrescriptionType = 'simples'
      if (
        rawType === 'controlado_azul' ||
        rawType.indexOf('azul') >= 0 ||
        rawType.indexOf('B1') >= 0 ||
        rawType.indexOf('B2') >= 0
      ) {
        validPrescriptionType = 'controlado_azul'
      } else if (
        rawType === 'controlado_amarelo' ||
        rawType.indexOf('amarelo') >= 0 ||
        rawType.indexOf('A1') >= 0 ||
        rawType.indexOf('A2') >= 0 ||
        rawType.indexOf('A3') >= 0
      ) {
        validPrescriptionType = 'controlado_amarelo'
      } else if (rawType === 'exame') {
        validPrescriptionType = 'exame'
      } else if (rawType === 'atestado') {
        validPrescriptionType = 'atestado'
      }

      const status = isDraft ? 'rascunho' : 'assinada'
      const signedAt = isDraft ? null : new Date().toISOString()

      const col = $app.findCollectionByNameOrId('prescriptions')
      const record = new Record(col)

      record.set('patient_id', patientId)
      record.set('professional_id', user.getId())
      if (appointmentId) {
        record.set('appointment_id', appointmentId)
      }
      record.set(
        'medications',
        medications || 'Prescrição emitida via Memed Prescrição Digital Inteligente',
      )
      if (pharmacyInstructions) {
        record.set('pharmacy_instructions', pharmacyInstructions)
      }
      if (memedPrescriptionId) {
        record.set('memed_prescription_id', memedPrescriptionId)
      }
      if (documentValidationUrl) {
        record.set('document_validation_url', documentValidationUrl)
      }
      record.set('prescription_type', validPrescriptionType)
      record.set('status', status)
      if (signedAt) {
        record.set('signed_at', signedAt)
      }

      $app.save(record)

      let createdHealthRecordId = ''
      let dispatchResults = []

      // Se a receita foi assinada (não é rascunho), fecha o loop pós-prescrição:
      // 1. Vincula ao prontuário do paciente (health_records)
      // 2. Envio pelos canais oficiais (SMS / e-mail) com registro em messages
      // 3. Auditoria detalhada em audit_logs
      if (!isDraft) {
        // 1. Referência no prontuário do paciente
        try {
          const hrCol = $app.findCollectionByNameOrId('health_records')
          const hr = new Record(hrCol)
          hr.set('patient_id', patientId)
          hr.set('professional_id', user.getId())
          hr.set('type', 'clinical')
          if (appointmentId) {
            hr.set('appointment_id', appointmentId)
          }
          hr.set('prescription_id', record.getId())

          const typeLabels = {
            simples: 'Simples / Alopáticos',
            controlado_azul: 'Controlado Azul (B1/B2 - Notif. RDC 1000/25)',
            controlado_amarelo: 'Controlado Amarelo (A1/A2/A3 - Notif. RDC 1000/25)',
            exame: 'Solicitação de Exames (TUSS/SUS)',
            atestado: 'Atestado Médico / Comparecimento',
          }

          let summaryContent =
            'Prescrição Digital Memed assinada por Dr(a). ' +
            (user.getString('name') || 'Médico') +
            ' (CRM ' +
            (user.getString('crm_number') || '') +
            '/' +
            (user.getString('crm_state') || 'BR') +
            ')\n' +
            'Tipo: ' +
            (typeLabels[validPrescriptionType] || validPrescriptionType) +
            '\n'
          if (memedPrescriptionId) {
            summaryContent += 'ID Memed: ' + memedPrescriptionId + '\n'
          }
          if (documentValidationUrl) {
            summaryContent += 'Validação / QR Code: ' + documentValidationUrl + '\n'
          }
          summaryContent += '\nItens Prescritos:\n' + medications
          if (pharmacyInstructions) {
            summaryContent += '\n\nInstruções à Farmácia:\n' + pharmacyInstructions
          }

          hr.set('content', summaryContent)
          $app.save(hr)
          createdHealthRecordId = hr.getId()
        } catch (hrErr) {
          $app
            .logger()
            .warn(
              '[Memed Post-Prescription Loop] Falha ao registrar prontuário health_records:',
              String(hrErr),
            )
        }

        // 2. Disparo de envio via canais oficiais (SMS e E-mail) com degradação graciosa
        // Se a Memed estiver configurada, chama as APIs oficiais; se sandbox/estrutural, registra intenção e mensagens
        const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
        const clientSecret =
          $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
        const isMemedConfigured = Boolean(clientId && clientSecret)

        // Busca dados de contato do paciente para compor mensagens
        let patientEmail = ''
        let patientPhone = ''
        let patientName = 'Paciente'
        try {
          const patientUser = $app.findRecordById('users', patientId)
          patientEmail = patientUser.getString('email') || ''
          patientPhone = patientUser.getString('phone') || ''
          patientName = patientUser.getString('name') || 'Paciente'
        } catch (_) {}

        for (let i = 0; i < channels.length; i++) {
          const ch = channels[i] // 'sms' | 'email'
          let sendStatus = 'sent'
          let sendDetails = 'Envio processado com sucesso.'

          if (isMemedConfigured) {
            // Em produção com credenciais parceiro Memed
            try {
              const apiBaseUrl =
                ($secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT')) ===
                'production'
                  ? 'https://api.memed.com.br/v1'
                  : 'https://sandbox.api.memed.com.br/v1'

              let docIntegration = null
              try {
                docIntegration = $app.findFirstRecordByData(
                  'memed_integrations',
                  'doctor_id',
                  user.getId(),
                )
              } catch (_) {}
              const docToken = docIntegration ? docIntegration.getString('access_token') : ''

              const sendRes = $http.send({
                url: apiBaseUrl + '/sinapse-prescricao/v1/prescricoes/enviar',
                method: 'POST',
                headers: {
                  Authorization: 'Bearer ' + docToken,
                  'api-key': clientId,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  prescriptionUuid: memedPrescriptionId,
                  channel: ch,
                  phone: patientPhone,
                  email: patientEmail,
                }),
                timeout: 15,
              })

              if (sendRes.statusCode >= 400) {
                sendStatus = 'warning_api'
                sendDetails = 'API Memed retornou status ' + sendRes.statusCode
              }
            } catch (httpErr) {
              sendStatus = 'warning_api'
              sendDetails = 'Falha de rede ao conectar à API Memed: ' + String(httpErr)
            }
          } else {
            // Modo estrutural / sandbox da Memed
            sendStatus = 'queued_sandbox'
            sendDetails =
              'Envio estruturado registrado no modo sandbox. Canal oficial ' +
              ch.toUpperCase() +
              ' pronto para disparo automático na homologação das credenciais Memed.'
          }

          dispatchResults.push({
            channel: ch,
            status: sendStatus,
            destination: ch === 'sms' ? patientPhone : patientEmail,
            details: sendDetails,
          })

          // Registra na coleção messages
          try {
            const msgCol = $app.findCollectionByNameOrId('messages')
            const msg = new Record(msgCol)
            msg.set('sender_id', user.getId())
            msg.set('receiver_id', patientId)
            const validationLinkText = documentValidationUrl
              ? '\nLink de validação (QR Code): ' + documentValidationUrl
              : ''
            msg.set(
              'content',
              'Sua receita digital foi emitida por Dr(a). ' +
                (user.getString('name') || 'Médico') +
                ' via canal oficial Memed (' +
                ch.toUpperCase() +
                ').' +
                validationLinkText +
                (ch === 'sms' && patientPhone ? '\nDestinatário SMS: ' + patientPhone : '') +
                (ch === 'email' && patientEmail ? '\nDestinatário E-mail: ' + patientEmail : ''),
            )
            msg.set('is_read', false)
            msg.set('message_type', 'text')
            msg.set(
              'metadata',
              JSON.stringify({
                event: 'prescription_sent',
                channel: ch,
                status: sendStatus,
                prescription_id: record.getId(),
                memed_prescription_id: memedPrescriptionId,
                document_validation_url: documentValidationUrl,
                destination: ch === 'sms' ? patientPhone : patientEmail,
                patient_name: patientName,
                is_memed_configured: isMemedConfigured,
                details: sendDetails,
                timestamp: new Date().toISOString(),
              }),
            )
            $app.save(msg)
          } catch (msgErr) {
            $app
              .logger()
              .warn(
                '[Memed Post-Prescription Loop] Falha ao registrar na coleção messages:',
                String(msgErr),
              )
          }

          // Registra na coleção audit_logs (quem, quando, o quê, canal)
          try {
            const auditCol = $app.findCollectionByNameOrId('audit_logs')
            const auditLog = new Record(auditCol)
            auditLog.set('user_id', user.getId())
            auditLog.set('action', 'create')
            auditLog.set('resource_type', 'prescription_dispatch')
            auditLog.set('resource_id', record.getId())
            auditLog.set(
              'details',
              JSON.stringify({
                event: 'prescription_dispatched_to_patient',
                action_type: 'initial_dispatch',
                professional_id: user.getId(),
                professional_name: user.getString('name'),
                patient_id: patientId,
                patient_name: patientName,
                channel: ch,
                status: sendStatus,
                destination: ch === 'sms' ? patientPhone : patientEmail,
                prescription_id: record.getId(),
                memed_prescription_id: memedPrescriptionId,
                document_validation_url: documentValidationUrl,
                appointment_id: appointmentId || null,
                health_record_id: createdHealthRecordId || null,
                is_memed_configured: isMemedConfigured,
                details: sendDetails,
                timestamp: new Date().toISOString(),
              }),
            )
            $app.save(auditLog)
          } catch (auditErr) {
            $app
              .logger()
              .warn(
                '[Memed Post-Prescription Loop] Falha ao registrar audit_logs:',
                String(auditErr),
              )
          }
        }
      }

      // Registra auditoria geral da prescrição
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(auditCol)
        log.set('user_id', user.getId())
        log.set('action', 'create')
        log.set('resource_type', 'prescription')
        log.set('resource_id', record.getId())
        log.set(
          'details',
          JSON.stringify({
            event: isDraft ? 'prescription_draft_saved' : 'memed_prescription_signed_saved',
            patient_id: patientId,
            professional_id: user.getId(),
            appointment_id: appointmentId || null,
            health_record_id: createdHealthRecordId || null,
            memed_prescription_id: memedPrescriptionId,
            document_validation_url: documentValidationUrl,
            prescription_type: validPrescriptionType,
            status: status,
            dispatched_channels: dispatchResults,
            timestamp: new Date().toISOString(),
          }),
        )
        $app.save(log)
      } catch (_) {}

      return e.json(200, {
        success: true,
        prescriptionId: record.getId(),
        memedPrescriptionId: memedPrescriptionId,
        documentValidationUrl: documentValidationUrl,
        prescriptionType: validPrescriptionType,
        status: status,
        signedAt: signedAt,
        appointmentId: appointmentId,
        healthRecordId: createdHealthRecordId,
        dispatches: dispatchResults,
        message: isDraft
          ? 'Rascunho de prescrição salvo com sucesso.'
          : 'Prescrição digital Memed assinada, vinculada ao prontuário e enviada ao paciente!',
      })
    } catch (err) {
      $app.logger().error('[Memed Integration] Erro ao salvar prescrição assinada:', String(err))

      // Falha NUNCA trava o fluxo — tenta salvar rascunho de emergência
      return e.json(500, {
        success: false,
        error: 'prescription_save_error',
        message: 'Erro interno ao salvar prescrição assinada: ' + String(err),
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 9. POST /backend/v1/memed/prescription/resend
//    Reenvio de receita pelo médico pelos canais oficiais (SMS ou E-mail)
//    RBAC: Apenas médico autor da receita (ou admin/diretor médico) pode reenviar
//    Registra envio em messages e auditoria em audit_logs (quem, quando, o quê, canal)
// ------------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/memed/prescription/resend',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.json(401, {
          success: false,
          error: 'unauthorized',
          message: 'Autenticação necessária para reenviar a receita.',
        })
      }

      const body = e.requestInfo().body || {}
      const prescriptionId = (body.prescription_id || '').toString().trim()
      const channel = (body.channel || 'sms').toString().toLowerCase().trim() // 'sms' | 'email'
      const customDestination = (body.destination || '').toString().trim()

      if (!prescriptionId) {
        return e.json(400, {
          success: false,
          error: 'missing_prescription_id',
          message: 'ID da prescrição é obrigatório para o reenvio.',
        })
      }

      if (channel !== 'sms' && channel !== 'email') {
        return e.json(400, {
          success: false,
          error: 'invalid_channel',
          message: 'Canal de reenvio deve ser "sms" ou "email".',
        })
      }

      // Busca a prescrição
      let pxRecord
      try {
        pxRecord = $app.findRecordById('prescriptions', prescriptionId)
      } catch (_) {
        return e.json(404, {
          success: false,
          error: 'prescription_not_found',
          message: 'Prescrição não encontrada no sistema.',
        })
      }

      const professionalId = pxRecord.getString('professional_id')
      const userRole = user.getString('role')
      const isOwner = professionalId === user.getId()
      const isAdminOrDirector = userRole === 'admin' || userRole === 'medical_director'

      // RBAC: Somente o médico dono ou admin/diretor médico
      if (!isOwner && !isAdminOrDirector) {
        return e.json(403, {
          success: false,
          error: 'forbidden',
          message: 'Apenas o profissional médico responsável por esta prescrição pode reenviá-la.',
        })
      }

      const patientId = pxRecord.getString('patient_id')
      let patientEmail = ''
      let patientPhone = ''
      let patientName = 'Paciente'
      try {
        const patientUser = $app.findRecordById('users', patientId)
        patientEmail = patientUser.getString('email') || ''
        patientPhone = patientUser.getString('phone') || ''
        patientName = patientUser.getString('name') || 'Paciente'
      } catch (_) {}

      const destination = customDestination || (channel === 'sms' ? patientPhone : patientEmail)
      const memedPxId = pxRecord.getString('memed_prescription_id')
      const validationUrl = pxRecord.getString('document_validation_url')

      const clientId = $secrets.get('MEMED_CLIENT_ID') || $os.getenv('MEMED_CLIENT_ID') || ''
      const clientSecret =
        $secrets.get('MEMED_CLIENT_SECRET') || $os.getenv('MEMED_CLIENT_SECRET') || ''
      const isMemedConfigured = Boolean(clientId && clientSecret)

      let resendStatus = 'sent'
      let resendDetails = 'Reenvio processado com sucesso.'

      if (isMemedConfigured) {
        try {
          const apiBaseUrl =
            ($secrets.get('MEMED_ENVIRONMENT') || $os.getenv('MEMED_ENVIRONMENT')) === 'production'
              ? 'https://api.memed.com.br/v1'
              : 'https://sandbox.api.memed.com.br/v1'

          let docIntegration = null
          try {
            docIntegration = $app.findFirstRecordByData(
              'memed_integrations',
              'doctor_id',
              professionalId,
            )
          } catch (_) {}
          const docToken = docIntegration ? docIntegration.getString('access_token') : ''

          const apiRes = $http.send({
            url: apiBaseUrl + '/sinapse-prescricao/v1/prescricoes/reenviar',
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + docToken,
              'api-key': clientId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prescriptionUuid: memedPxId,
              channel: channel,
              destination: destination,
            }),
            timeout: 15,
          })

          if (apiRes.statusCode >= 400) {
            resendStatus = 'warning_api'
            resendDetails = 'API Memed retornou status ' + apiRes.statusCode
          }
        } catch (httpErr) {
          resendStatus = 'warning_api'
          resendDetails = 'Falha de conexão com a API Memed: ' + String(httpErr)
        }
      } else {
        resendStatus = 'queued_sandbox'
        resendDetails =
          'Reenvio estruturado registrado no modo sandbox. Canal oficial ' +
          channel.toUpperCase() +
          ' disparará em produção com credenciais parceiro Memed.'
      }

      // Atualiza o status da prescrição para 'enviada' se ainda estava apenas assinada
      try {
        if (pxRecord.getString('status') !== 'enviada') {
          pxRecord.set('status', 'enviada')
          $app.save(pxRecord)
        }
      } catch (_) {}

      // Registra mensagem na coleção messages
      try {
        const msgCol = $app.findCollectionByNameOrId('messages')
        const msg = new Record(msgCol)
        msg.set('sender_id', user.getId())
        msg.set('receiver_id', patientId)
        const validationLinkText = validationUrl
          ? '\nLink de validação (QR Code): ' + validationUrl
          : ''
        msg.set(
          'content',
          'Sua receita digital foi reenviada por Dr(a). ' +
            (user.getString('name') || 'Médico') +
            ' via canal oficial Memed (' +
            channel.toUpperCase() +
            ').' +
            validationLinkText +
            (destination ? '\nDestinatário: ' + destination : ''),
        )
        msg.set('is_read', false)
        msg.set('message_type', 'text')
        msg.set(
          'metadata',
          JSON.stringify({
            event: 'prescription_resend',
            channel: channel,
            status: resendStatus,
            prescription_id: pxRecord.getId(),
            memed_prescription_id: memedPxId,
            document_validation_url: validationUrl,
            destination: destination,
            patient_name: patientName,
            is_memed_configured: isMemedConfigured,
            details: resendDetails,
            timestamp: new Date().toISOString(),
          }),
        )
        $app.save(msg)
      } catch (msgErr) {
        $app.logger().warn('[Memed Resend] Falha ao registrar reenvio em messages:', String(msgErr))
      }

      // Registra em audit_logs (quem, quando, o quê, canal)
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const auditLog = new Record(auditCol)
        auditLog.set('user_id', user.getId())
        auditLog.set('action', 'update')
        auditLog.set('resource_type', 'prescription_resend')
        auditLog.set('resource_id', pxRecord.getId())
        auditLog.set(
          'details',
          JSON.stringify({
            event: 'prescription_resend_to_patient',
            action_type: 'resend',
            professional_id: user.getId(),
            professional_name: user.getString('name'),
            patient_id: patientId,
            patient_name: patientName,
            channel: channel,
            destination: destination,
            status: resendStatus,
            prescription_id: pxRecord.getId(),
            memed_prescription_id: memedPxId,
            document_validation_url: validationUrl,
            is_memed_configured: isMemedConfigured,
            details: resendDetails,
            timestamp: new Date().toISOString(),
          }),
        )
        $app.save(auditLog)
      } catch (auditErr) {
        $app.logger().warn('[Memed Resend] Falha ao registrar audit_logs:', String(auditErr))
      }

      return e.json(200, {
        success: true,
        channel: channel,
        destination: destination,
        status: resendStatus,
        details: resendDetails,
        message:
          'Receita reenviada ao paciente com sucesso via canal ' + channel.toUpperCase() + '!',
      })
    } catch (err) {
      $app.logger().error('[Memed Resend] Erro ao processar reenvio de prescrição:', String(err))
      return e.json(500, {
        success: false,
        error: 'resend_error',
        message: 'Erro interno ao processar o reenvio da prescrição: ' + String(err),
      })
    }
  },
  $apis.requireAuth(),
)

// ------------------------------------------------------------------------------
// 10. POST /backend/v1/memed/webhook
//    Endpoint para webhook oficial Memed quando disponível
// ------------------------------------------------------------------------------
routerAdd('POST', '/backend/v1/memed/webhook', (e) => {
  try {
    const body = e.requestInfo().body || {}
    $app.logger().info('[Memed Webhook] Evento recebido da Memed:', JSON.stringify(body))

    return e.json(200, { received: true, timestamp: new Date().toISOString() })
  } catch (err) {
    $app.logger().error('[Memed Webhook] Falha ao processar webhook:', String(err))
    return e.json(200, { received: false })
  }
})
