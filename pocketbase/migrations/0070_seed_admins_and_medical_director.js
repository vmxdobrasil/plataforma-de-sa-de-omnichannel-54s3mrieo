migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name, role) => {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', email)
        // already seeded
      } catch (_) {
        const record = new Record(users)
        record.setEmail(email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', name)
        record.set('role', role)
        app.save(record)
      }
    }

    seedUser('valterpmendonca@gmail.com', 'Valter Paula Mendonça', 'medical_director')
    seedUser('victor@vmedbrasil.com.br', 'Victor Hugo Tavares Mendonça', 'medical_director')
    seedUser(
      'fauzer@vmedbrasil.com.br',
      'Fauzer Andrigo Mendonça Simoes Rangel',
      'medical_director',
    )
  },
  (app) => {
    const emails = [
      'valterpmendonca@gmail.com',
      'victor@vmedbrasil.com.br',
      'fauzer@vmedbrasil.com.br',
    ]
    emails.forEach((email) => {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(record)
      } catch (_) {}
    })
  },
)
