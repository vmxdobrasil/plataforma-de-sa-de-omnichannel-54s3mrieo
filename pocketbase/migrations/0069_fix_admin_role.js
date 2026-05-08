migrate(
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'valterpmendonca@gmail.com')
      admin.set('role', 'medical_director')
      admin.set('company_id', '')
      app.save(admin)
    } catch (_) {}
  },
  (app) => {
    // No-op down
  },
)
