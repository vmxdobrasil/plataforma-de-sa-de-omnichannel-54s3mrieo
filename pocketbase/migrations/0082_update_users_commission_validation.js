migrate(
  (app) => {
    // Fix state values for 'GO' and ensure clean persistence
    app
      .db()
      .newQuery("UPDATE users SET state = 'GO' WHERE LOWER(state) IN ('go', 'goias', 'goiás')")
      .execute()

    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Align constraints for commission_rate to business rules
    const cr = users.fields.getByName('commission_rate')
    if (cr) {
      cr.min = 7.99
      cr.max = 13.89
    }

    const pcr = users.fields.getByName('pending_commission_rate')
    if (pcr) {
      pcr.min = 7.99
      pcr.max = 13.89
    }

    app.save(users)
  },
  (app) => {
    // No strict rollback needed as values might be legitimate, but we can unset min/max
  },
)
