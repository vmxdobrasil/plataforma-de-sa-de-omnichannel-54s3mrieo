onRecordAfterCreateSuccess((e) => {
  const tx = e.record
  const employeeId = tx.get('employee_id')
  const companyId = tx.get('company_id')
  const amount = Number(tx.get('amount')) || 0
  const type = tx.get('type')
  const category = tx.get('category')

  try {
    const employee = $app.findRecordById('users', employeeId)
    let categoryName = category === 'medication' ? 'Medicamentos' : 'Saúde'

    if (type === 'credit') {
      const msg = new Record($app.findCollectionByNameOrId('messages'))
      msg.set('sender_id', companyId)
      msg.set('receiver_id', employeeId)
      msg.set(
        'content',
        `Seu benefício de ${categoryName} foi renovado! Valor adicionado: R$ ${amount.toFixed(2)}.`,
      )
      msg.set('is_read', false)
      $app.save(msg)
    } else if (type === 'debit') {
      const healthAllowance = Number(employee.get('health_allowance')) || 0
      const medicationAllowance = Number(employee.get('medication_allowance')) || 0

      let thresholdRaw = employee.get('low_balance_threshold')
      let threshold = 50.0
      if (thresholdRaw !== null && thresholdRaw !== '' && thresholdRaw !== undefined) {
        threshold = Number(thresholdRaw)
      }

      let balance = category === 'medication' ? medicationAllowance : healthAllowance

      if (balance < threshold) {
        const msg = new Record($app.findCollectionByNameOrId('messages'))
        msg.set('sender_id', companyId)
        msg.set('receiver_id', employeeId)
        msg.set(
          'content',
          `Atenção: Seu saldo de ${categoryName} está baixo (R$ ${balance.toFixed(2)}). Planeje seus próximos usos.`,
        )
        msg.set('is_read', false)
        $app.save(msg)
      }
    }
  } catch (err) {
    console.log('Error generating notification:', err)
  }

  e.next()
}, 'benefit_transactions')
