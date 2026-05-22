onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  const current = e.record

  const oldStatus = original.getString('payment_status')
  const newStatus = current.getString('payment_status')

  if (oldStatus !== 'confirmed' && newStatus === 'confirmed') {
    try {
      const admins = $app.findRecordsByFilter(
        'users',
        "role = 'admin' || role = 'medical_director'",
        '',
        10,
        0,
      )
      for (const admin of admins) {
        const msg = new Record($app.findCollectionByNameOrId('messages'))
        msg.set('sender_id', admin.id)
        msg.set('receiver_id', admin.id)
        msg.set(
          'content',
          `Transação Asaas confirmada (Split/Pagamento) no valor de R$ ${current.getFloat('amount').toFixed(2)} (Ref: ${current.id}).`,
        )
        msg.set('is_read', false)
        msg.set('message_type', 'text')
        $app.save(msg)
      }
    } catch (err) {
      $app.logger().error('Error creating notification on payment confirmed', 'err', err)
    }
  }

  e.next()
}, 'benefit_transactions')
