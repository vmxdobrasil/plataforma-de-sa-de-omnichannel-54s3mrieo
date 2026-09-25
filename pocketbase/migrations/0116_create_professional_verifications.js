migrate(
  (app) => {
    // 1. Criar coleção professional_verifications se não existir
    try {
      app.findCollectionByNameOrId('professional_verifications')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('users')

      const verificationsCol = new Collection({
        name: 'professional_verifications',
        type: 'base',
        // Regra de leitura: apenas o próprio profissional e administradores/diretoria médica
        listRule:
          '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        viewRule:
          '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        // Criação e atualização pelo próprio médico ou admin/diretor
        createRule:
          '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        updateRule:
          '@request.auth.id != "" && (@request.auth.role = "medical_director" || @request.auth.role = "admin")',
        deleteRule: '@request.auth.id != "" && @request.auth.role = "admin"',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'crm_numero',
            type: 'text',
            required: true,
          },
          {
            name: 'crm_uf',
            type: 'text',
            required: true,
          },
          {
            name: 'crm_situacao',
            type: 'text', // 'ativo', 'cancelado', 'suspenso', 'cassado', 'nao_localizado', 'em_analise'
            required: false,
          },
          {
            name: 'crm_especialidade',
            type: 'text',
            required: false,
          },
          {
            name: 'nome_cfm',
            type: 'text',
            required: false,
          },
          {
            name: 'divergencia_nome',
            type: 'bool',
            required: false,
          },
          {
            name: 'status_validacao',
            type: 'select',
            required: true,
            values: ['pendente', 'validado', 'invalidado', 'validacao_manual'],
            maxSelect: 1,
          },
          {
            name: 'fonte_validacao',
            type: 'select',
            required: true,
            values: ['cfm_webservice', 'api_terceiro', 'manual', 'fallback_resiliente'],
            maxSelect: 1,
          },
          {
            name: 'data_validacao',
            type: 'date',
            required: false,
          },
          {
            name: 'resposta_bruta',
            type: 'json',
            required: false,
          },
          {
            name: 'observacoes_admin',
            type: 'text',
            required: false,
          },
          {
            name: 'certidao_arquivo',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
            required: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_prof_verif_user ON professional_verifications (user)',
          'CREATE INDEX idx_prof_verif_crm ON professional_verifications (crm_numero, crm_uf)',
          'CREATE INDEX idx_prof_verif_status ON professional_verifications (status_validacao)',
        ],
      })

      app.save(verificationsCol)
    }

    // 2. Garantir campo crm_situacao no usuário para cache rápido de permissão
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('crm_situacao')) {
      usersCol.fields.add(
        new TextField({
          name: 'crm_situacao',
        }),
      )
      app.save(usersCol)
    }
  },
  (app) => {
    try {
      const verificationsCol = app.findCollectionByNameOrId('professional_verifications')
      app.delete(verificationsCol)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('users')
      const f = usersCol.fields.getByName('crm_situacao')
      if (f) {
        usersCol.fields.remove(f)
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
