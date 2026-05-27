migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const cr = users.fields.getByName('commission_rate')
    if (cr) {
      cr.min = 7.98
      cr.max = 13.9
    }

    const pcr = users.fields.getByName('pending_commission_rate')
    if (pcr) {
      pcr.min = 7.98
      pcr.max = 13.9
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

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
)
