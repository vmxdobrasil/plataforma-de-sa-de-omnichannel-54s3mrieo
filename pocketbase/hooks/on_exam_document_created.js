onRecordAfterCreateSuccess((e) => {
  const doc = e.record
  if (doc.getString('type') !== 'exam') return e.next()

  const patientId = doc.getString('patient_id')
  if (!patientId) return e.next()

  const senderId = doc.getString('professional_id')
  if (!senderId) return e.next()

  try {
    const msg = new Record($app.findCollectionByNameOrId('messages'))
    msg.set('sender_id', senderId)
    msg.set('receiver_id', patientId)
    msg.set('content', 'Novo resultado de exame disponível em sua central de documentos.')
    msg.set('is_read', false)
    msg.set('message_type', 'text')
    $app.save(msg)
  } catch (err) {
    $app.logger().error('Error sending exam document notification', 'err', err)
  }

  return e.next()
}, 'documents')
