migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'rh@techcorp.com')
      return
    } catch (_) {}

    const company = new Record(users)
    company.setEmail('rh@techcorp.com')
    company.setPassword('Skip@Pass')
    company.setVerified(true)
    company.set('name', 'Tech Corp S/A')
    company.set('role', 'company')
    company.set('tax_id', '12.345.678/0001-90')
    app.save(company)

    try {
      const p1 = app.findFirstRecordByData('users', 'email', 'valterpmendonca@gmail.com')
      p1.set('company_id', company.id)
      p1.set('health_allowance', 1000)
      p1.set('allowance_type', 'benefit')
      app.save(p1)
    } catch (_) {}

    try {
      app.findAuthRecordByEmail('users', 'joao.employee@techcorp.com')
    } catch (_) {
      const p2 = new Record(users)
      p2.setEmail('joao.employee@techcorp.com')
      p2.setPassword('Skip@Pass')
      p2.setVerified(true)
      p2.set('name', 'João Funcionário')
      p2.set('role', 'patient')
      p2.set('company_id', company.id)
      p2.set('health_allowance', 500)
      p2.set('allowance_type', 'payroll_deduction')
      app.save(p2)
    }
  },
  (app) => {
    try {
      const c = app.findAuthRecordByEmail('users', 'rh@techcorp.com')
      app.delete(c)
    } catch (_) {}
    try {
      const e = app.findAuthRecordByEmail('users', 'joao.employee@techcorp.com')
      app.delete(e)
    } catch (_) {}
  },
)
