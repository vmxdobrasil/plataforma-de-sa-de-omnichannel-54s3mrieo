migrate(
  (app) => {
    var usersColId = '_pb_users_auth_'

    var col = new Collection({
      name: 'registration_leads',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || @request.auth.role = 'medical_director'",
      viewRule: "@request.auth.role = 'admin' || @request.auth.role = 'medical_director'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'medical_director'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'text', required: true },
        { name: 'phone', type: 'text', required: false },
        { name: 'tax_id', type: 'text', required: false },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['company', 'partner', 'individual'],
        },
        { name: 'employee_count', type: 'number', required: false },
        { name: 'benefit_intention', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'contacted', 'converted', 'rejected'],
        },
        { name: 'metadata', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_registration_leads_status ON registration_leads (status)',
        'CREATE INDEX idx_registration_leads_type ON registration_leads (type)',
        'CREATE INDEX idx_registration_leads_email ON registration_leads (email)',
      ],
    })
    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('registration_leads'))
    } catch (_) {}
  },
)
