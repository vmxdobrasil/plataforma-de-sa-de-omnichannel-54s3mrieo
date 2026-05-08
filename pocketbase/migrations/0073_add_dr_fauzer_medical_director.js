migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'fauzer@vmedbrasil.com.br')
      existing.set('role', 'medical_director')
      existing.set('crm_number', '29015')
      existing.set('crm_state', 'GO')
      existing.set('name', 'Dr. Fauzer Andrigo Mendonça Simões Rangel')
      app.save(existing)
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('fauzer@vmedbrasil.com.br')
    record.setPassword('Vmed@2024')
    record.setVerified(true)
    record.set('name', 'Dr. Fauzer Andrigo Mendonça Simões Rangel')
    record.set('role', 'medical_director')
    record.set('crm_number', '29015')
    record.set('crm_state', 'GO')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'fauzer@vmedbrasil.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
