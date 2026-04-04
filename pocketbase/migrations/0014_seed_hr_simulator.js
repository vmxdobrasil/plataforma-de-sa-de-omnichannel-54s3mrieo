migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    let companyId = ''
    try {
      const company = app.findFirstRecordByFilter('users', "role = 'company'")
      companyId = company.id
    } catch (_) {
      try {
        const newCompany = new Record(users)
        newCompany.setEmail('hrcompany@vmed.local')
        newCompany.setPassword('Skip@Pass')
        newCompany.setVerified(true)
        newCompany.set('name', 'Acme Corp HR')
        newCompany.set('role', 'company')
        app.save(newCompany)
        companyId = newCompany.id
      } catch (_) {}
    }

    if (companyId) {
      try {
        app.findAuthRecordByEmail('users', 'eligible.emp@vmed.local')
      } catch (_) {
        const emp = new Record(users)
        emp.setEmail('eligible.emp@vmed.local')
        emp.setPassword('Skip@Pass')
        emp.setVerified(true)
        emp.set('name', 'John Eligible')
        emp.set('role', 'patient')
        emp.set('company_id', companyId)
        emp.set('health_allowance', 500)
        emp.set('medication_allowance', 150)
        emp.set('auto_renew_benefits', true)
        app.save(emp)
      }

      try {
        app.findAuthRecordByEmail('users', 'ineligible.emp@vmed.local')
      } catch (_) {
        const emp2 = new Record(users)
        emp2.setEmail('ineligible.emp@vmed.local')
        emp2.setPassword('Skip@Pass')
        emp2.setVerified(true)
        emp2.set('name', 'Jane Ineligible')
        emp2.set('role', 'patient')
        emp2.set('company_id', companyId)
        emp2.set('health_allowance', 300)
        emp2.set('auto_renew_benefits', false)
        app.save(emp2)
      }
    }
  },
  (app) => {
    try {
      const emp1 = app.findAuthRecordByEmail('users', 'eligible.emp@vmed.local')
      app.delete(emp1)
    } catch (_) {}
    try {
      const emp2 = app.findAuthRecordByEmail('users', 'ineligible.emp@vmed.local')
      app.delete(emp2)
    } catch (_) {}
    try {
      const comp = app.findAuthRecordByEmail('users', 'hrcompany@vmed.local')
      app.delete(comp)
    } catch (_) {}
  },
)
