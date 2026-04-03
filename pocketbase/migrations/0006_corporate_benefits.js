migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const roleField = new SelectField({
      name: 'role',
      values: ['patient', 'professional', 'company'],
      required: true,
    })
    users.fields.add(roleField)

    if (!users.fields.getByName('company_id')) {
      users.fields.add(
        new RelationField({
          name: 'company_id',
          collectionId: users.id,
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('tax_id')) {
      users.fields.add(new TextField({ name: 'tax_id' }))
    }

    if (!users.fields.getByName('health_allowance')) {
      users.fields.add(new NumberField({ name: 'health_allowance' }))
    }

    if (!users.fields.getByName('allowance_type')) {
      users.fields.add(
        new SelectField({
          name: 'allowance_type',
          values: ['benefit', 'payroll_deduction'],
        }),
      )
    }

    users.updateRule =
      'id = @request.auth.id || parent_id = @request.auth.id || company_id = @request.auth.id'

    app.save(users)

    const appointments = app.findCollectionByNameOrId('appointments')

    const transactions = new Collection({
      name: 'benefit_transactions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (employee_id = @request.auth.id || company_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (employee_id = @request.auth.id || company_id = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'employee_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        {
          name: 'company_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          maxSelect: 1,
        },
        {
          name: 'appointment_id',
          type: 'relation',
          required: false,
          collectionId: appointments.id,
          maxSelect: 1,
        },
        { name: 'amount', type: 'number', required: true },
        { name: 'type', type: 'select', required: true, values: ['credit', 'debit'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })

    app.save(transactions)
  },
  (app) => {
    try {
      const tx = app.findCollectionByNameOrId('benefit_transactions')
      app.delete(tx)
    } catch (e) {}

    try {
      const users = app.findCollectionByNameOrId('users')
      users.fields.removeByName('company_id')
      users.fields.removeByName('tax_id')
      users.fields.removeByName('health_allowance')
      users.fields.removeByName('allowance_type')

      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['patient', 'professional'],
          required: true,
        }),
      )

      users.updateRule = 'id = @request.auth.id || parent_id = @request.auth.id'

      app.save(users)
    } catch (e) {}
  },
)
