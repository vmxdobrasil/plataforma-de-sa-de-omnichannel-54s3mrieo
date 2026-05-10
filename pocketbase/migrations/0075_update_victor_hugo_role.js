migrate(
  (app) => {
    try {
      const users = app.findRecordsByFilter('users', "name ~ 'Victor Hugo%'", '', 10, 0)
      for (let i = 0; i < users.length; i++) {
        users[i].set('specialty', 'Diretor Jurídico/Administrador')
        users[i].set('role', 'admin')
        app.save(users[i])
      }
    } catch (err) {
      console.log('Migration 0075 up error:', err)
    }
  },
  (app) => {
    try {
      const users = app.findRecordsByFilter('users', "name ~ 'Victor Hugo%'", '', 10, 0)
      for (let i = 0; i < users.length; i++) {
        users[i].set('specialty', 'Diretor Médico')
        users[i].set('role', 'medical_director')
        app.save(users[i])
      }
    } catch (err) {
      console.log('Migration 0075 down error:', err)
    }
  },
)
