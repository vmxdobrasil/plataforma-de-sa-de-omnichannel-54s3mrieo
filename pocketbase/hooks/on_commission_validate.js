onRecordValidate((e) => {
  const record = e.record

  if (record.collection().name === 'users') {
    const role = record.getString('role')
    if (role === 'pharmacy' || role === 'laboratory') {
      const rate = record.get('commission_rate')
      if (rate !== null && rate !== '') {
        const numRate = Number(rate)
        if (numRate < 7.99 || numRate > 13.89) {
          throw new BadRequestError('Dados inválidos', {
            commission_rate: new ValidationError(
              'invalid_range',
              'A taxa deve estar entre 7,99% e 13,89%',
            ),
          })
        }
      }

      const pendingRate = record.get('pending_commission_rate')
      if (pendingRate !== null && pendingRate !== '') {
        const numPendingRate = Number(pendingRate)
        if (numPendingRate < 7.99 || numPendingRate > 13.89) {
          throw new BadRequestError('Dados inválidos', {
            pending_commission_rate: new ValidationError(
              'invalid_range',
              'A taxa deve estar entre 7,99% e 13,89%',
            ),
          })
        }
      }
    }
  }

  e.next()
}, 'users')
