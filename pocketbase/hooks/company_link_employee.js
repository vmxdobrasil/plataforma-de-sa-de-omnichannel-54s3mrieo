routerAdd(
  'POST',
  '/backend/v1/company/link-employee',
  (e) => {
    const body = e.requestInfo().body
    const email = body.email
    const companyId = e.auth?.id

    if (!companyId || e.auth?.getString('role') !== 'company') {
      throw new ForbiddenError('Only companies can link employees')
    }

    try {
      const user = $app.findAuthRecordByEmail('users', email)
      user.set('company_id', companyId)
      if (body.health_allowance !== undefined) {
        user.set('health_allowance', body.health_allowance)
      }
      if (body.allowance_type) {
        user.set('allowance_type', body.allowance_type)
      }
      $app.save(user)
      return e.json(200, { success: true, user: user })
    } catch (err) {
      throw new NotFoundError('User not found with this email')
    }
  },
  $apis.requireAuth(),
)
