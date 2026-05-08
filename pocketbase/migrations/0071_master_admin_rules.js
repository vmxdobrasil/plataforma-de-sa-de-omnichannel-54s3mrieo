migrate(
  (app) => {
    const bt = app.findCollectionByNameOrId('benefit_transactions')
    bt.listRule =
      "@request.auth.id != '' && (employee_id = @request.auth.id || company_id = @request.auth.id || @request.auth.role = 'medical_director')"
    bt.viewRule =
      "@request.auth.id != '' && (employee_id = @request.auth.id || company_id = @request.auth.id || @request.auth.role = 'medical_director')"
    app.save(bt)

    const pp = app.findCollectionByNameOrId('pharmacy_products')
    pp.updateRule =
      "@request.auth.id != '' && (pharmacy_id = @request.auth.id || @request.auth.role = 'medical_director')"
    pp.deleteRule =
      "@request.auth.id != '' && (pharmacy_id = @request.auth.id || @request.auth.role = 'medical_director')"
    app.save(pp)

    const gc = app.findCollectionByNameOrId('generated_content')
    gc.listRule =
      "@request.auth.id != '' && (professional_id = @request.auth.id || @request.auth.role = 'medical_director')"
    gc.viewRule =
      "@request.auth.id != '' && (professional_id = @request.auth.id || @request.auth.role = 'medical_director')"
    gc.deleteRule =
      "@request.auth.id != '' && (professional_id = @request.auth.id || @request.auth.role = 'medical_director')"
    app.save(gc)
  },
  (app) => {
    const bt = app.findCollectionByNameOrId('benefit_transactions')
    bt.listRule =
      "@request.auth.id != '' && (employee_id = @request.auth.id || company_id = @request.auth.id)"
    bt.viewRule =
      "@request.auth.id != '' && (employee_id = @request.auth.id || company_id = @request.auth.id)"
    app.save(bt)

    const pp = app.findCollectionByNameOrId('pharmacy_products')
    pp.updateRule = "@request.auth.id != '' && pharmacy_id = @request.auth.id"
    pp.deleteRule = "@request.auth.id != '' && pharmacy_id = @request.auth.id"
    app.save(pp)

    const gc = app.findCollectionByNameOrId('generated_content')
    gc.listRule = "@request.auth.id != '' && professional_id = @request.auth.id"
    gc.viewRule = "@request.auth.id != '' && professional_id = @request.auth.id"
    gc.deleteRule = "@request.auth.id != '' && professional_id = @request.auth.id"
    app.save(gc)
  },
)
