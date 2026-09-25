migrate(
  (app) => {
    const appointmentsCol = app.findCollectionByNameOrId('appointments')
    const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')
    const healthRecordsCol = app.findCollectionByNameOrId('health_records')

    // 1. prescriptions.appointment_id
    if (!prescriptionsCol.fields.getByName('appointment_id')) {
      prescriptionsCol.fields.add(
        new RelationField({
          name: 'appointment_id',
          collectionId: appointmentsCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    // 2. health_records.appointment_id
    if (!healthRecordsCol.fields.getByName('appointment_id')) {
      healthRecordsCol.fields.add(
        new RelationField({
          name: 'appointment_id',
          collectionId: appointmentsCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    // 3. health_records.prescription_id
    if (!healthRecordsCol.fields.getByName('prescription_id')) {
      healthRecordsCol.fields.add(
        new RelationField({
          name: 'prescription_id',
          collectionId: prescriptionsCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    prescriptionsCol.addIndex('idx_prescriptions_patient_id', false, 'patient_id', '')
    prescriptionsCol.addIndex('idx_prescriptions_appt_id', false, 'appointment_id', '')
    app.save(prescriptionsCol)

    healthRecordsCol.addIndex('idx_health_records_appt_id', false, 'appointment_id', '')
    healthRecordsCol.addIndex('idx_health_records_px_id', false, 'prescription_id', '')
    app.save(healthRecordsCol)
  },
  (app) => {
    try {
      const prescriptionsCol = app.findCollectionByNameOrId('prescriptions')
      const apptFieldPx = prescriptionsCol.fields.getByName('appointment_id')
      if (apptFieldPx) {
        prescriptionsCol.fields.remove(apptFieldPx)
      }
      prescriptionsCol.removeIndex('idx_prescriptions_patient_id')
      prescriptionsCol.removeIndex('idx_prescriptions_appt_id')
      app.save(prescriptionsCol)
    } catch (_) {}

    try {
      const healthRecordsCol = app.findCollectionByNameOrId('health_records')
      const apptFieldHr = healthRecordsCol.fields.getByName('appointment_id')
      if (apptFieldHr) {
        healthRecordsCol.fields.remove(apptFieldHr)
      }
      const pxFieldHr = healthRecordsCol.fields.getByName('prescription_id')
      if (pxFieldHr) {
        healthRecordsCol.fields.remove(pxFieldHr)
      }
      healthRecordsCol.removeIndex('idx_health_records_appt_id')
      healthRecordsCol.removeIndex('idx_health_records_px_id')
      app.save(healthRecordsCol)
    } catch (_) {}
  },
)
