migrate(
  (app) => {
    const professionals = app.findRecordsByFilter('users', "role = 'professional'", '', 10, 0)
    for (const p of professionals) {
      if (!p.get('crm_number')) {
        p.set('crm_number', '123456')
        p.set('crm_state', 'SP')
        app.save(p)
      }
    }

    const patients = app.findRecordsByFilter('users', "role = 'patient'", '', 10, 0)
    for (const pt of patients) {
      pt.set('allow_external_sync', true)
      if (!pt.get('document_id')) {
        pt.set('document_id', '12345678900')
      }
      app.save(pt)
    }
  },
  (app) => {
    // Not strictly necessary to rollback seed data
  },
)
