routerAdd(
  'POST',
  '/backend/v1/points/redeem',
  (e) => {
    var body = e.requestInfo().body || {}
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    var pointsToRedeem = parseInt(body.points || '0', 10)
    if (pointsToRedeem <= 0) return e.badRequestError('points must be positive')

    try {
      var user = $app.findRecordById('users', userId)
      var currentPoints = user.getInt('loyalty_points') || 0
      if (currentPoints < pointsToRedeem) {
        return e.badRequestError('insufficient points')
      }

      user.set('loyalty_points', currentPoints - pointsToRedeem)
      $app.save(user)

      var histCol = $app.findCollectionByNameOrId('loyalty_points_history')
      var hist = new Record(histCol)
      hist.set('user_id', userId)
      hist.set('points_delta', -pointsToRedeem)
      hist.set('reason', 'points_redemption')
      $app.save(hist)

      var discountValue = pointsToRedeem / 100

      return e.json(200, {
        success: true,
        redeemed_points: pointsToRedeem,
        discount_value: discountValue,
        remaining_points: currentPoints - pointsToRedeem,
      })
    } catch (err) {
      return e.internalServerError('failed to redeem points')
    }
  },
  $apis.requireAuth(),
)
