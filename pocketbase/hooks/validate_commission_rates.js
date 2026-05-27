onRecordValidate((e) => {
  const record = e.record

  if (record.collection().name === 'users') {
    const role = record.getString('role')
    if (role === 'pharmacy' || role === 'laboratory') {
      const rateStr = record.getString('commission_rate')
      if (rateStr !== '') {
        const rate = record.getFloat('commission_rate')
        if (rate < 7.99 || rate > 13.89) {
          throw new BadRequestError('Dados inválidos', {
            commission_rate: new ValidationError(
              'invalid_range',
              'A taxa de comissão deve estar entre 7,99% e 13,89%',
            ),
          })
        }
      }

      const pendingRateStr = record.getString('pending_commission_rate')
      if (pendingRateStr !== '') {
        const pendingRate = record.getFloat('pending_commission_rate')
        if (pendingRate < 7.99 || pendingRate > 13.89) {
          throw new BadRequestError('Dados inválidos', {
            pending_commission_rate: new ValidationError(
              'invalid_range',
              'A taxa de comissão deve estar entre 7,99% e 13,89%',
            ),
          })
        }
      }
    }
  }

  e.next()
}, 'users')
