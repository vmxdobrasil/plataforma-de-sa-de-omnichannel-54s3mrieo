migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    let mainUser
    try {
      mainUser = app.findAuthRecordByEmail('users', 'valterpmendonca@gmail.com')
    } catch (e) {
      mainUser = new Record(users)
      mainUser.setEmail('valterpmendonca@gmail.com')
      mainUser.setPassword('Skip@Pass')
      mainUser.setVerified(true)
      mainUser.set('name', 'Valter Mendonca')
      mainUser.set('role', 'patient')
      app.save(mainUser)
    }

    mainUser.set('blood_type', 'O+')
    mainUser.set('allergies', 'Penicilina')
    mainUser.set('emergency_contact_name', 'Maria Mendonca')
    mainUser.set('emergency_contact_phone', '11999999999')
    mainUser.set('loyalty_points', 150)
    app.save(mainUser)

    let dependent
    try {
      dependent = app.findAuthRecordByEmail('users', 'junior@mendonca.com')
    } catch (e) {
      dependent = new Record(users)
      dependent.setEmail('junior@mendonca.com')
      dependent.setPassword('Skip@Pass')
      dependent.setVerified(true)
      dependent.set('name', 'Junior Mendonca')
      dependent.set('role', 'patient')
      dependent.set('parent_id', mainUser.id)
      dependent.set('blood_type', 'A+')
      app.save(dependent)
    }

    let prof
    try {
      prof = app.findAuthRecordByEmail('users', 'dr.silva@vmed.com')
    } catch (e) {
      prof = new Record(users)
      prof.setEmail('dr.silva@vmed.com')
      prof.setPassword('Skip@Pass')
      prof.setVerified(true)
      prof.set('name', 'Dr. Silva')
      prof.set('role', 'professional')
      prof.set('specialty', 'Cardiologista')
      app.save(prof)
    }

    try {
      app.findFirstRecordByData('messages', 'content', 'Olá Dr. Silva, meu exame chegou.')
    } catch (e) {
      const messages = app.findCollectionByNameOrId('messages')
      const msg = new Record(messages)
      msg.set('sender_id', mainUser.id)
      msg.set('receiver_id', prof.id)
      msg.set('content', 'Olá Dr. Silva, meu exame chegou.')
      msg.set('is_read', false)
      app.save(msg)
    }

    try {
      app.findFirstRecordByData('treatment_plans', 'title', 'Reabilitação Cardíaca')
    } catch (e) {
      const tp = app.findCollectionByNameOrId('treatment_plans')
      const record = new Record(tp)
      record.set('patient_id', mainUser.id)
      record.set('title', 'Reabilitação Cardíaca')
      record.set('description', 'Acompanhamento após exame alterado')
      record.set('status', 'active')
      app.save(record)
    }

    try {
      app.findFirstRecordByData('appointments', 'notes', 'Consulta inicial seed')
    } catch (e) {
      const appts = app.findCollectionByNameOrId('appointments')
      const a = new Record(appts)
      a.set('patient_id', mainUser.id)
      a.set('professional_id', prof.id)
      a.set('dateTime', new Date(Date.now() + 86400000).toISOString())
      a.set('type', 'Online')
      a.set('status', 'scheduled')
      a.set('notes', 'Consulta inicial seed')
      app.save(a)
    }
  },
  (app) => {},
)
