migrate(
  (app) => {
    var users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('referral_code')) {
      users.fields.add(new TextField({ name: 'referral_code' }))
    }
    if (!users.fields.getByName('referred_by')) {
      users.fields.add(
        new RelationField({ name: 'referred_by', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }
    if (!users.fields.getByName('origin_type')) {
      users.fields.add(new SelectField({ name: 'origin_type', values: ['b2c', 'b2b'] }))
    }
    if (!users.fields.getByName('utm_source')) {
      users.fields.add(new TextField({ name: 'utm_source' }))
    }
    if (!users.fields.getByName('utm_medium')) {
      users.fields.add(new TextField({ name: 'utm_medium' }))
    }
    if (!users.fields.getByName('utm_campaign')) {
      users.fields.add(new TextField({ name: 'utm_campaign' }))
    }
    if (!users.fields.getByName('is_dependent')) {
      users.fields.add(new BoolField({ name: 'is_dependent' }))
    }
    if (!users.fields.getByName('kinship')) {
      users.fields.add(new TextField({ name: 'kinship' }))
    }
    app.save(users)

    app
      .db()
      .newQuery(
        "UPDATE users SET document_id = '' WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY document_id) AND document_id != '' AND document_id IS NOT NULL",
      )
      .execute()

    users.addIndex('idx_users_referral_code', true, 'referral_code', "referral_code != ''")
    users.addIndex('idx_users_document_id', true, 'document_id', "document_id != ''")
    app.save(users)

    var campaigns = new Collection({
      name: 'campaigns',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'source', type: 'text' },
        { name: 'medium', type: 'text' },
        { name: 'qr_code_content', type: 'text' },
        { name: 'visit_count', type: 'number' },
        { name: 'registration_count', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_campaigns_slug ON campaigns (slug)'],
    })
    app.save(campaigns)

    var apptColId = app.findCollectionByNameOrId('appointments').id
    var loyaltyHistory = new Collection({
      name: 'loyalty_points_history',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'medical_director' || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'points_delta', type: 'number', required: true },
        {
          name: 'reason',
          type: 'select',
          required: true,
          values: ['signup', 'dependent', 'referral'],
        },
        { name: 'related_appointment_id', type: 'relation', collectionId: apptColId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(loyaltyHistory)

    var landingVisits = new Collection({
      name: 'landing_visits',
      type: 'base',
      listRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'medical_director' || @request.auth.role = 'admin'",
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'utm_source', type: 'text' },
        { name: 'utm_medium', type: 'text' },
        { name: 'utm_campaign', type: 'text' },
        { name: 'origin', type: 'text' },
        { name: 'referral_code', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(landingVisits)
  },
  (app) => {
    var users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      users.removeIndex('idx_users_referral_code')
    } catch (_) {}
    try {
      users.removeIndex('idx_users_document_id')
    } catch (_) {}
    ;[
      'referral_code',
      'referred_by',
      'origin_type',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'is_dependent',
      'kinship',
    ].forEach(function (f) {
      try {
        users.fields.removeByName(f)
      } catch (_) {}
    })
    app.save(users)

    ;['campaigns', 'loyalty_points_history', 'landing_visits'].forEach(function (name) {
      try {
        var col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    })
  },
)
