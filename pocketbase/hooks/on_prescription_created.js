onRecordAfterCreateSuccess((e) => {
  const px = e.record
  const msg = new Record($app.findCollectionByNameOrId('messages'))
  msg.set('sender_id', px.get('professional_id'))
  msg.set('receiver_id', px.get('patient_id'))
  msg.set('content', 'Nova receita digital disponível em seu perfil.')
  msg.set('is_read', false)
  $app.save(msg)
  e.next()
}, 'prescriptions')
