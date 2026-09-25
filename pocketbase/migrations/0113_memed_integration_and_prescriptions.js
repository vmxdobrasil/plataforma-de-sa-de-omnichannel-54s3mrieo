migrate(
  (app) => {
    // 1. memed_integrations
    try {
      app.findCollectionByNameOrId('memed_integrations')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('users')
      const memedCol = new Collection({
        name: 'memed_integrations',
        type: 'base',
        listRule:
          '@request.auth.id != "" && (doctor_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        viewRule:
          '@request.auth.id != "" && (doctor_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        createRule:
          '@request.auth.id != "" && (doctor_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        updateRule:
          '@request.auth.id != "" && (doctor_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        deleteRule:
          '@request.auth.id != "" && (doctor_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")',
        fields: [
          {
            name: 'doctor_id',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'connection_status',
            type: 'select',
            required: true,
            values: ['desconectado', 'conectando', 'conectado', 'erro'],
            maxSelect: 1,
          },
          {
            name: 'access_token',
            type: 'text',
            required: false,
            hidden: true,
          },
          {
            name: 'refresh_token',
            type: 'text',
            required: false,
            hidden: true,
          },
          {
            name: 'memed_account_id',
            type: 'text',
            required: false,
          },
          {
            name: 'connected_at',
            type: 'date',
            required: false,
          },
          {
            name: 'last_sync',
            type: 'date',
            required: false,
          },
          {
            name: 'error_log',
            type: 'json',
            required: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_memed_integrations_doctor ON memed_integrations (doctor_id)',
          'CREATE INDEX idx_memed_integrations_status ON memed_integrations (connection_status)',
        ],
      })
      app.save(memedCol)
    }

    // 2. prescriptions extension
    const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')

    if (!prescriptionsCol.fields.getByName('memed_prescription_id')) {
      prescriptionsCol.fields.add(
        new TextField({
          name: 'memed_prescription_id',
        }),
      )
    }

    if (!prescriptionsCol.fields.getByName('document_validation_url')) {
      prescriptionsCol.fields.add(
        new URLField({
          name: 'document_validation_url',
        }),
      )
    }

    if (!prescriptionsCol.fields.getByName('prescription_type')) {
      prescriptionsCol.fields.add(
        new SelectField({
          name: 'prescription_type',
          values: ['simples', 'controlado_azul', 'controlado_amarelo', 'exame', 'atestado'],
          maxSelect: 1,
        }),
      )
    }

    if (!prescriptionsCol.fields.getByName('status')) {
      prescriptionsCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['rascunho', 'assinada', 'enviada'],
          maxSelect: 1,
        }),
      )
    }

    if (!prescriptionsCol.fields.getByName('signed_at')) {
      prescriptionsCol.fields.add(
        new DateField({
          name: 'signed_at',
        }),
      )
    }

    prescriptionsCol.listRule =
      '@request.auth.id != "" && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")'
    prescriptionsCol.viewRule =
      '@request.auth.id != "" && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")'
    prescriptionsCol.createRule =
      '@request.auth.id != "" && (professional_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")'
    prescriptionsCol.updateRule =
      '@request.auth.id != "" && (professional_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")'
    prescriptionsCol.deleteRule =
      '@request.auth.id != "" && (professional_id = @request.auth.id || @request.auth.role = "medical_director" || @request.auth.role = "admin")'

    prescriptionsCol.addIndex(
      'idx_prescriptions_memed_id',
      false,
      'memed_prescription_id',
      'memed_prescription_id != ""',
    )
    prescriptionsCol.addIndex('idx_prescriptions_status', false, 'status', '')

    app.save(prescriptionsCol)
  },
  (app) => {
    try {
      const memedCol = app.findCollectionByNameOrId('memed_integrations')
      app.delete(memedCol)
    } catch (_) {}

    try {
      const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')
      const fieldsToRemove = [
        'memed_prescription_id',
        'document_validation_url',
        'prescription_type',
        'status',
        'signed_at',
      ]
      fieldsToRemove.forEach((fName) => {
        const field = prescriptionsCol.fields.getByName(fName)
        if (field) {
          prescriptionsCol.fields.remove(field)
        }
      })
      prescriptionsCol.removeIndex('idx_prescriptions_memed_id')
      prescriptionsCol.removeIndex('idx_prescriptions_status')
      app.save(prescriptionsCol)
    } catch (_) {}
  },
)
