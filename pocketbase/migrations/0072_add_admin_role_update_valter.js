migrate(
  (app) => {
    const collectionsToUpdate = [
      'users',
      'appointments',
      'health_records',
      'benefit_transactions',
      'documents',
      'system_settings',
      'generated_content',
      'audit_logs',
      'insurance_partners',
      'pharmacy_products',
    ]

    for (const name of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(name)
        let updated = false
        const rules = ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule']

        for (const rule of rules) {
          if (col[rule] && col[rule].includes("'medical_director'")) {
            col[rule] = col[rule].replace(
              /@request\.auth\.role\s*=\s*'medical_director'/g,
              "(@request.auth.role = 'medical_director' || @request.auth.role = 'admin')",
            )
            updated = true
          }
        }

        if (name === 'users') {
          const roleField = col.fields.getByName('role')
          if (roleField && !roleField.values.includes('admin')) {
            const vals = []
            for (let i = 0; i < roleField.values.length; i++) {
              vals.push(roleField.values[i])
            }
            vals.push('admin')
            col.fields.add(
              new SelectField({
                name: 'role',
                required: roleField.required,
                values: vals,
                maxSelect: 1,
              }),
            )
            updated = true
          }
        }

        if (updated) {
          app.save(col)
        }
      } catch (_) {}
    }

    // Update Valter's role
    try {
      const valter = app.findAuthRecordByEmail('users', 'valterpmendonca@gmail.com')
      if (valter.get('role') === 'medical_director') {
        valter.set('role', 'admin')
        app.save(valter)

        try {
          const auditLogCol = app.findCollectionByNameOrId('audit_logs')
          const auditRecord = new Record(auditLogCol)
          auditRecord.set('user_id', valter.id)
          auditRecord.set('action', 'update')
          auditRecord.set('resource_type', 'users')
          auditRecord.set('resource_id', valter.id)
          auditRecord.set(
            'details',
            JSON.stringify({ previous_role: 'medical_director', new_role: 'admin' }),
          )
          app.save(auditRecord)
        } catch (_) {}
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const valter = app.findAuthRecordByEmail('users', 'valterpmendonca@gmail.com')
      if (valter.get('role') === 'admin') {
        valter.set('role', 'medical_director')
        app.save(valter)
      }
    } catch (_) {}
  },
)
