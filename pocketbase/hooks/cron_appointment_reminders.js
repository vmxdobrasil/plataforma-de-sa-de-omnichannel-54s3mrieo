// pocketbase/hooks/cron_appointment_reminders.js
// Runs every 15 minutes to send reminders for upcoming appointments
cronAdd('appointment_reminders', '*/15 * * * *', () => {
  try {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // PocketBase sort uses '-' prefix for DESC or '+' / no prefix for ASC.
    const appts = $app.findRecordsByFilter(
      'appointments',
      'status = "scheduled" && reminder_24h_sent = false',
      '+dateTime',
      50,
      0,
    )

    for (const appt of appts) {
      const dtStr = appt.getString('dateTime')
      if (!dtStr) continue
      const apptDate = new Date(dtStr)
      if (apptDate <= in24h && apptDate > now) {
        appt.set('reminder_24h_sent', true)
        $app.save(appt)
      }
    }
  } catch (err) {
    $app.logger().error('appointment_reminders cron error', 'error', err.message || String(err))
  }
})
