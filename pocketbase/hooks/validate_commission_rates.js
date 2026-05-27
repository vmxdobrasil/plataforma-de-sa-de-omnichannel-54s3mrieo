onRecordValidate((e) => {
  const record = e.record

  if (record.collection().name === 'users') {
    const role = record.getString('role')
    if (role === 'pharmacy' || role === 'laboratory') {
      const rate = record.get('commission_rate')
      if (rate !== null && rate !== '' && Number(rate) !== 0) {
        const val = Number(rate)
        if (val < 7.9899 || val > 13.8901) {
          throw new BadRequestError('Dados inválidos', {
            commission_rate: new ValidationError(
              'invalid_range',
              'A taxa deve estar entre 7,99% e 13,89%',
            ),
          })
        }
      }

      const pendingRate = record.get('pending_commission_rate')
      if (pendingRate !== null && pendingRate !== '' && Number(pendingRate) !== 0) {
        const pVal = Number(pendingRate)
        if (pVal < 7.9899 || pVal > 13.8901) {
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
