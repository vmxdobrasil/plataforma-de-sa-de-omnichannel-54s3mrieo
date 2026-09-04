// ============================================================
// INTEGRAÇÃO V MED BRASIL -> FINANÇASMED (PACIENTES)
// Endpoint utilitário para listar pacientes de um médico no FinançasMed:
// GET /backend/v1/financasmed/pacientes?medico_email=...
// Requer autenticação do usuário V MED e repassa com X-API-Key do secret.
// ============================================================

routerAdd(
  'GET',
  '/backend/v1/financasmed/pacientes',
  (e) => {
    const user = e.auth
    if (!user) {
      return e.json(401, { error: 'Não autorizado' })
    }

    const query = e.requestInfo().query || {}
    let medicoEmail = (query.medico_email || '').trim()

    // Se o usuário logado for um médico e não informou medico_email, usa o próprio e-mail
    if (!medicoEmail && user.getString('role') === 'professional') {
      medicoEmail = user.getString('email') || ''
    }

    if (!medicoEmail) {
      return e.json(400, {
        error: 'Parâmetro medico_email obrigatório',
        pacientes: [],
        total: 0,
      })
    }

    const apiKey = $os.getenv('V_MED_API_KEY') || ''
    if (!apiKey) {
      console.log('[FinançasMed] V_MED_API_KEY não configurada no backend')
      return e.json(500, {
        error: 'Chave de integração V_MED_API_KEY não configurada no servidor',
        pacientes: [],
        total: 0,
      })
    }

    try {
      const targetUrl =
        'https://financasmed.goskip.app/api/hooks/vmed/pacientes?medico_email=' +
        encodeURIComponent(medicoEmail)

      const res = $http.send({
        method: 'GET',
        url: targetUrl,
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        timeout: 10,
      })

      const statusCode = res.statusCode || 200
      let data = {}
      try {
        data = res.json || JSON.parse(res.raw || '{}')
      } catch (_) {
        data = { raw: res.raw }
      }

      console.log(
        '[FinançasMed] GET pacientes status ' +
          statusCode +
          ' | médico: ' +
          medicoEmail +
          ' | total: ' +
          (data.total !== undefined ? data.total : data.pacientes ? data.pacientes.length : 0),
      )

      return e.json(statusCode, data)
    } catch (err) {
      console.log('[FinançasMed] erro ao consultar pacientes no FinançasMed:', String(err))
      return e.json(502, {
        error: 'Falha ao comunicar com FinançasMed: ' + String(err),
        pacientes: [],
        total: 0,
      })
    }
  },
  $apis.requireAuth(),
)
