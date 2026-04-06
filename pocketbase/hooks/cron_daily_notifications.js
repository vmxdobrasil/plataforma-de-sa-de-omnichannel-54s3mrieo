cronAdd('daily_notifications', '0 8 * * *', () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().replace('T', ' ').substring(0, 19)
  const todayStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

  try {
    const appts = $app.findRecordsByFilter(
      'appointments',
      `dateTime >= {:today} && dateTime <= {:tomorrow} && status = 'scheduled'`,
      '',
      1000,
      0,
      { today: todayStr, tomorrow: tomorrowStr },
    )

    appts.forEach((appt) => {
      const msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', appt.get('professional_id'))
      msg.set('receiver_id', appt.get('patient_id'))
      msg.set('content', 'Lembrete: Você tem uma consulta agendada para amanhã.')
      msg.set('is_read', false)
      $app.saveNoValidate(msg)
    })
  } catch (e) {}

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().replace('T', ' ').substring(0, 19)

  try {
    const docs = $app.findRecordsByFilter(
      'documents',
      `expiry_date != '' && expiry_date <= {:nextWeek}`,
      '',
      1000,
      0,
      { nextWeek: nextWeekStr },
    )

    docs.forEach((doc) => {
      const msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', doc.get('patient_id'))
      msg.set('receiver_id', doc.get('patient_id'))
      msg.set('content', `Aviso: Seu documento "${doc.get('title')}" expira em 7 dias ou menos.`)
      msg.set('is_read', false)
      $app.saveNoValidate(msg)
    })
  } catch (e) {}

  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 14)
  const pastDateStr = pastDate.toISOString().replace('T', ' ').substring(0, 19)

  try {
    const goals = $app.findRecordsByFilter(
      'health_goals',
      `status = 'pending' && created <= {:pastDate}`,
      '',
      1000,
      0,
      { pastDate: pastDateStr },
    )

    goals.forEach((goal) => {
      const msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', goal.get('patient_id'))
      msg.set('receiver_id', goal.get('patient_id'))
      msg.set('content', `Lembrete de Saúde: Sua meta "${goal.get('title')}" ainda está pendente!`)
      msg.set('is_read', false)
      $app.saveNoValidate(msg)
    })
  } catch (e) {}
})
