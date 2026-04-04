migrate(
  (app) => {
    const collection = new Collection({
      name: 'documents',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'company')",
      viewRule:
        "@request.auth.id != '' && (patient_id = @request.auth.id || patient_id.parent_id = @request.auth.id || professional_id = @request.auth.id || @request.auth.role = 'company')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && (patient_id = @request.auth.id || professional_id = @request.auth.id)",
      fields: [
        {
          name: 'patient_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'professional_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'appointment_id',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('appointments').id,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['exam', 'prescription', 'certificate', 'other'],
          maxSelect: 1,
        },
        {
          name: 'file',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('documents')
    app.delete(collection)
  },
)
