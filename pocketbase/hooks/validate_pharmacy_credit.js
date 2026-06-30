routerAdd(
  'POST',
  '/backend/v1/validate-pharmacy-credit',
  (e) => {
    const body = e.requestInfo().body || {}
    const cpf = (body.cpf || '').replace(/\D/g, '')
    const amount = Number(body.amount) || 0
    const category = body.category || 'medication'
    const description = body.description || 'Compra na farmácia'
    const partnerId = e.auth ? e.auth.id : ''

    if (!cpf) return e.badRequestError('CPF é obrigatório')
    if (amount <= 0) return e.badRequestError('Valor deve ser maior que zero')
    if (!partnerId) return e.unauthorizedError('Autenticação necessária')

    let employee
    try {
      employee = $app.findFirstRecordByData('users', 'document_id', cpf)
    } catch (_) {
      return e.badRequestError('Funcionário não encontrado com este CPF')
    }

    if (employee.getBool('is_blocked')) {
      return e.badRequestError('Conta do funcionário está bloqueada')
    }

    const companyId = employee.getString('company_id')
    if (!companyId) {
      return e.badRequestError('Funcionário não vinculado a uma empresa ativa')
    }

    let company
    try {
      company = $app.findRecordById('users', companyId)
    } catch (_) {
      return e.badRequestError('Empresa não encontrada')
    }

    const companyStatus = company.getString('company_status')
    if (companyStatus === 'suspended') {
      return e.badRequestError('Empresa suspensa. Contate o administrador.')
    }

    const allowanceField = category === 'medication' ? 'medication_allowance' : 'health_allowance'
    const currentAllowance = employee.getFloat(allowanceField) || 0

    if (currentAllowance < amount) {
      return e.badRequestError('Saldo insuficiente. Saldo atual: R$ ' + currentAllowance.toFixed(2))
    }

    try {
      const txCol = $app.findCollectionByNameOrId('benefit_transactions')
      const tx = new Record(txCol)
      tx.set('employee_id', employee.id)
      tx.set('company_id', companyId)
      tx.set('partner_id', partnerId)
      tx.set('amount', amount)
      tx.set('type', 'debit')
      tx.set('category', category)
      tx.set('description', description)
      tx.set('payment_status', 'confirmed')
      $app.save(tx)

      employee.set(allowanceField, currentAllowance - amount)
      $app.save(employee)

      return e.json(200, {
        success: true,
        transaction_id: tx.id,
        remaining_balance: currentAllowance - amount,
        employee_name: employee.getString('name'),
      })
    } catch (err) {
      $app.logger().error('Error processing pharmacy credit', 'err', err)
      return e.json(500, { error: 'Erro ao processar transação' })
    }
  },
  $apis.requireAuth(),
)
