onRecordAfterCreateSuccess((e) => {
  var parentId = e.record.getString('parent_id')
  if (!parentId) return e.next()

  var POINTS = 30

  try {
    var parent = $app.findRecordById('users', parentId)
    var pts = parent.getInt('loyalty_points') || 0
    parent.set('loyalty_points', pts + POINTS)
    $app.save(parent)

    var histCol = $app.findCollectionByNameOrId('loyalty_points_history')
    var hist = new Record(histCol)
    hist.set('user_id', parentId)
    hist.set('points_delta', POINTS)
    hist.set('reason', 'dependent')
    $app.save(hist)
  } catch (err) {
    $app.logger().error('loyalty dependent failed', 'error', err.message)
  }

  return e.next()
}, 'users')
