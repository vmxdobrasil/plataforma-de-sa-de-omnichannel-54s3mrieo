migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    if (!col.fields.getByName('rh_contact_name')) {
      col.fields.add(new TextField({ name: 'rh_contact_name' }))
    }
    if (!col.fields.getByName('rh_contact_phone')) {
      col.fields.add(new TextField({ name: 'rh_contact_phone' }))
    }
    if (!col.fields.getByName('rh_contact_email')) {
      col.fields.add(new TextField({ name: 'rh_contact_email' }))
    }
    if (!col.fields.getByName('finance_contact_name')) {
      col.fields.add(new TextField({ name: 'finance_contact_name' }))
    }
    if (!col.fields.getByName('finance_contact_phone')) {
      col.fields.add(new TextField({ name: 'finance_contact_phone' }))
    }
    if (!col.fields.getByName('finance_contact_email')) {
      col.fields.add(new TextField({ name: 'finance_contact_email' }))
    }
    if (!col.fields.getByName('department')) {
      col.fields.add(new TextField({ name: 'department' }))
    }
    if (!col.fields.getByName('matricula')) {
      col.fields.add(new TextField({ name: 'matricula' }))
    }
    if (!col.fields.getByName('job_title')) {
      col.fields.add(new TextField({ name: 'job_title' }))
    }
    if (!col.fields.getByName('company_status')) {
      col.fields.add(
        new SelectField({
          name: 'company_status',
          values: ['active', 'suspended', 'pending_contract'],
        }),
      )
    }
    if (!col.fields.getByName('credit_limit_type')) {
      col.fields.add(
        new SelectField({
          name: 'credit_limit_type',
          values: ['fixed', 'percentage'],
        }),
      )
    }
    if (!col.fields.getByName('credit_limit_percentage')) {
      col.fields.add(new NumberField({ name: 'credit_limit_percentage' }))
    }

    app.save(col)

    const savedTypes = {}
    try {
      const companies = app.findRecordsByFilter('users', "role = 'company'", '', 10000, 0)
      for (const c of companies) {
        savedTypes[c.id] = c.getString('allowance_type')
      }
    } catch (e) {}

    col.fields.removeByName('allowance_type')
    col.fields.add(
      new SelectField({
        name: 'allowance_type',
        values: ['benefit', 'payroll_deduction', 'mixed'],
      }),
    )
    app.save(col)

    try {
      const companies2 = app.findRecordsByFilter('users', "role = 'company'", '', 10000, 0)
      for (const c of companies2) {
        if (savedTypes[c.id]) {
          c.set('allowance_type', savedTypes[c.id])
        }
        if (!c.get('company_status')) {
          c.set('company_status', 'active')
        }
        app.save(c)
      }
    } catch (e) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.fields.removeByName('rh_contact_name')
    col.fields.removeByName('rh_contact_phone')
    col.fields.removeByName('rh_contact_email')
    col.fields.removeByName('finance_contact_name')
    col.fields.removeByName('finance_contact_phone')
    col.fields.removeByName('finance_contact_email')
    col.fields.removeByName('department')
    col.fields.removeByName('matricula')
    col.fields.removeByName('job_title')
    col.fields.removeByName('company_status')
    col.fields.removeByName('credit_limit_type')
    col.fields.removeByName('credit_limit_percentage')

    col.fields.removeByName('allowance_type')
    col.fields.add(
      new SelectField({
        name: 'allowance_type',
        values: ['benefit', 'payroll_deduction'],
      }),
    )

    app.save(col)
  },
)
