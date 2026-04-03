migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')

    const seedUser = (email, name, role, specialty, avatarSeed) => {
      try {
        return app.findAuthRecordByEmail('users', email)
      } catch (_) {
        const record = new Record(usersCol)
        record.setEmail(email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', name)
        record.set('role', role)
        if (specialty) record.set('specialty', specialty)
        app.save(record)
        return record
      }
    }

    const patient = seedUser('valterpmendonca@gmail.com', 'Valter Mendonça', 'patient')
    const doc1 = seedUser(
      'doc1@vmed.com',
      'Dra. Carolina Mendes',
      'professional',
      'Dermatologia Estética',
    )
    const doc2 = seedUser('doc2@vmed.com', 'Dr. Roberto Alves', 'professional', 'Ortopedia')
    const doc3 = seedUser('doc3@vmed.com', 'Dra. Juliana Ferreira', 'professional', 'Psicologia')

    const apptsCol = app.findCollectionByNameOrId('appointments')
    try {
      app.findFirstRecordByData('appointments', 'patient_id', patient.id)
    } catch (_) {
      const d1 = new Date()
      d1.setDate(d1.getDate() + 1)
      d1.setHours(9, 0, 0, 0)

      const appt1 = new Record(apptsCol)
      appt1.set('patient_id', patient.id)
      appt1.set('professional_id', doc1.id)
      appt1.set('dateTime', d1.toISOString())
      appt1.set('type', 'Presencial')
      appt1.set('status', 'scheduled')
      appt1.set('notes', 'Avaliação estética de rotina.')
      app.save(appt1)

      const d2 = new Date()
      d2.setDate(d2.getDate() + 2)
      d2.setHours(14, 30, 0, 0)

      const appt2 = new Record(apptsCol)
      appt2.set('patient_id', patient.id)
      appt2.set('professional_id', doc3.id)
      appt2.set('dateTime', d2.toISOString())
      appt2.set('type', 'Online')
      appt2.set('status', 'scheduled')
      appt2.set('notes', 'Sessão online de acompanhamento.')
      app.save(appt2)
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('appointments', '1=1', '', 100, 0)
      for (let r of records) {
        app.delete(r)
      }
    } catch (e) {}

    const emails = ['valterpmendonca@gmail.com', 'doc1@vmed.com', 'doc2@vmed.com', 'doc3@vmed.com']
    for (let email of emails) {
      try {
        const u = app.findAuthRecordByEmail('users', email)
        app.delete(u)
      } catch (e) {}
    }
  },
)
