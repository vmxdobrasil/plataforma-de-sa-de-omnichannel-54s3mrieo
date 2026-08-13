migrate(
  (app) => {
    // ---- 1. asaas_config collection ----
    let asaasConfigCol
    try {
      asaasConfigCol = app.findCollectionByNameOrId('asaas_config')
    } catch (_) {
      asaasConfigCol = new Collection({
        name: 'asaas_config',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'api_key', type: 'text', required: false, hidden: true },
          {
            name: 'environment',
            type: 'select',
            required: true,
            values: ['sandbox', 'production'],
            maxSelect: 1,
          },
          { name: 'webhook_url', type: 'url', required: false },
          { name: 'is_active', type: 'bool' },
          { name: 'last_tested_at', type: 'date' },
          { name: 'last_test_status', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(asaasConfigCol)
    }

    // ---- 2. transacoes collection ----
    let transacoesCol
    try {
      transacoesCol = app.findCollectionByNameOrId('transacoes')
    } catch (_) {
      transacoesCol = new Collection({
        name: 'transacoes',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'asaas_id', type: 'text' },
          { name: 'asaas_payment_id', type: 'text' },
          { name: 'valor', type: 'number' },
          { name: 'descricao', type: 'text' },
          { name: 'cliente_nome', type: 'text' },
          { name: 'cliente_cpf_cnpj', type: 'text' },
          {
            name: 'metodo_pagamento',
            type: 'select',
            values: ['BOLETO', 'PIX', 'CREDIT_CARD'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            values: ['pending', 'received', 'confirmed', 'overdue', 'canceled'],
            maxSelect: 1,
          },
          { name: 'link_pagamento', type: 'url' },
          { name: 'invoice_url', type: 'url' },
          { name: 'data_vencimento', type: 'date' },
          { name: 'external_reference', type: 'text' },
          { name: 'metadata', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_transacoes_asaas_id ON transacoes (asaas_id)',
          'CREATE INDEX idx_transacoes_status ON transacoes (status)',
          'CREATE INDEX idx_transacoes_created ON transacoes (created DESC)',
        ],
      })
      app.save(transacoesCol)
    }

    // ---- 3. Seed default asaas_config (production key already in env) ----
    try {
      app.findFirstRecordByData('asaas_config', 'environment', 'production')
    } catch (_) {
      const record = new Record(asaasConfigCol)
      record.set('api_key', '')
      record.set('environment', 'production')
      record.set(
        'webhook_url',
        'https://plataforma-de-saude-omnichannel-2585c.shrd00.internal.goskip.dev/backend/v1/asaas/webhook',
      )
      record.set('is_active', false)
      app.save(record)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('asaas_config')
      app.delete(col)
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('transacoes')
      app.delete(col)
    } catch (_) {}
  },
)
