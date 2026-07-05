migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var templates = new Collection({
      name: 'notification_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'medical_director'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'medical_director'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'slug', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'subject', type: 'text' },
        { name: 'body_text', type: 'text', required: true },
        { name: 'body_html', type: 'text' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['email', 'whatsapp', 'both'],
          maxSelect: 1,
        },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_notification_templates_slug ON notification_templates (slug)',
      ],
    })
    app.save(templates)

    var logs = new Collection({
      name: 'notification_logs',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (recipient_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'medical_director')",
      viewRule:
        "@request.auth.id != '' && (recipient_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'medical_director')",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'medical_director'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'recipient_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        { name: 'template_slug', type: 'text' },
        {
          name: 'message_type',
          type: 'select',
          required: true,
          values: ['email', 'whatsapp'],
          maxSelect: 1,
        },
        { name: 'subject', type: 'text' },
        { name: 'content', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'sent', 'delivered', 'failed'],
          maxSelect: 1,
        },
        { name: 'priority', type: 'select', values: ['normal', 'high', 'critical'], maxSelect: 1 },
        { name: 'error_message', type: 'text' },
        { name: 'retry_count', type: 'number' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notification_logs_recipient ON notification_logs (recipient_id)',
        'CREATE INDEX idx_notification_logs_status ON notification_logs (status)',
      ],
    })
    app.save(logs)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('notification_templates'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('notification_logs'))
    } catch (_) {}
  },
)
