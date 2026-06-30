migrate(
  (app) => {
    var usersColId = '_pb_users_auth_'
    var apptColId = app.findCollectionByNameOrId('appointments').id
    var btColId = app.findCollectionByNameOrId('benefit_transactions').id

    var splitConfig = new Collection({
      name: 'configuracoes_split',
      type: 'base',
      listRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      deleteRule: null,
      fields: [
        { name: 'default_commission', type: 'number' },
        { name: 'consultation_percentage', type: 'number' },
        { name: 'exam_percentage', type: 'number' },
        { name: 'pharmacy_percentage', type: 'number' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(splitConfig)

    var faturas = new Collection({
      name: 'faturas_empresas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (company_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (company_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')",
      createRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      deleteRule: null,
      fields: [
        {
          name: 'company_id',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
        },
        { name: 'billing_period_start', type: 'date', required: true },
        { name: 'billing_period_end', type: 'date', required: true },
        { name: 'total_amount', type: 'number', required: true },
        { name: 'status', type: 'select', required: true, values: ['open', 'paid', 'overdue'] },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(faturas)

    var regrasCashback = new Collection({
      name: 'regras_cashback',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      deleteRule: null,
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          values: [
            'health_service',
            'medication',
            'preventive_service',
            'emergency_service',
            'exam',
          ],
        },
        { name: 'percentage', type: 'number', required: true },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(regrasCashback)

    var logAsaas = new Collection({
      name: 'log_transacoes_asaas',
      type: 'base',
      listRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'asaas_id', type: 'text' },
        { name: 'appointment_id', type: 'relation', collectionId: apptColId, maxSelect: 1 },
        { name: 'benefit_transaction_id', type: 'relation', collectionId: btColId, maxSelect: 1 },
        { name: 'amount', type: 'number' },
        { name: 'split_amount', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(logAsaas)

    var loyaltyCol = app.findCollectionByNameOrId('loyalty_points_history')
    loyaltyCol.fields.removeByName('reason')
    loyaltyCol.fields.add(
      new SelectField({
        name: 'reason',
        required: true,
        values: ['signup', 'dependent', 'referral', 'cashback', 'points_redemption'],
      }),
    )
    app.save(loyaltyCol)

    try {
      app.findFirstRecordByData('configuracoes_split', 'is_active', true)
    } catch (_) {
      var cfg = new Record(splitConfig)
      cfg.set('default_commission', 10)
      cfg.set('consultation_percentage', 10)
      cfg.set('exam_percentage', 12)
      cfg.set('pharmacy_percentage', 8)
      cfg.set('is_active', true)
      app.save(cfg)
    }

    var cashbackSeeds = [
      { category: 'exam', percentage: 5 },
      { category: 'health_service', percentage: 3 },
      { category: 'medication', percentage: 2 },
    ]
    for (var i = 0; i < cashbackSeeds.length; i++) {
      try {
        app.findFirstRecordByData('regras_cashback', 'category', cashbackSeeds[i].category)
      } catch (_) {
        var r = new Record(regrasCashback)
        r.set('category', cashbackSeeds[i].category)
        r.set('percentage', cashbackSeeds[i].percentage)
        r.set('is_active', true)
        app.save(r)
      }
    }
  },
  (app) => {
    ;['configuracoes_split', 'faturas_empresas', 'regras_cashback', 'log_transacoes_asaas'].forEach(
      function (name) {
        try {
          app.delete(app.findCollectionByNameOrId(name))
        } catch (_) {}
      },
    )
    try {
      var loyaltyCol = app.findCollectionByNameOrId('loyalty_points_history')
      loyaltyCol.fields.removeByName('reason')
      loyaltyCol.fields.add(
        new SelectField({
          name: 'reason',
          required: true,
          values: ['signup', 'dependent', 'referral'],
        }),
      )
      app.save(loyaltyCol)
    } catch (_) {}
  },
)
