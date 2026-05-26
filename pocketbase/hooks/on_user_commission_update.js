onRecordUpdateRequest((e) => {
  if (e.hasSuperuserAuth()) return e.next()

  const authRecord = e.auth
  const original = e.record.original()
  const current = e.record

  if (original.getFloat('commission_rate') !== current.getFloat('commission_rate')) {
    if (authRecord?.getString('role') !== 'admin') {
      return e.forbiddenError('Somente administradores podem alterar a taxa de comissão ativa.')
    }
  }

  return e.next()
}, 'users')
