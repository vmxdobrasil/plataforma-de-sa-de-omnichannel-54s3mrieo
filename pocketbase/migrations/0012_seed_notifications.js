migrate(
  (app) => {
    const messages = app.findCollectionByNameOrId('messages')

    let patient
    let company
    try {
      const allUsers = app.findRecordsByFilter('users', "role = 'patient'", '-created', 1, 0)
      if (allUsers.length > 0) patient = allUsers[0]

      const allCompanies = app.findRecordsByFilter('users', "role = 'company'", '-created', 1, 0)
      if (allCompanies.length > 0) company = allCompanies[0]
    } catch (e) {
      // skip
    }

    if (patient && company) {
      try {
        app.findFirstRecordByData(
          'messages',
          'content',
          'Seu benefício de Saúde foi renovado! Valor adicionado: R$ 150.00.',
        )
      } catch (_) {
        const msg = new Record(messages)
        msg.set('sender_id', company.id)
        msg.set('receiver_id', patient.id)
        msg.set('content', 'Seu benefício de Saúde foi renovado! Valor adicionado: R$ 150.00.')
        msg.set('is_read', false)
        app.save(msg)
      }
    }
  },
  (app) => {
    try {
      const msg = app.findFirstRecordByData(
        'messages',
        'content',
        'Seu benefício de Saúde foi renovado! Valor adicionado: R$ 150.00.',
      )
      app.delete(msg)
    } catch (_) {}
  },
)
