migrate(
  (app) => {
    try {
      app.findFirstRecordByData('users', 'name', 'Farmácia Vida Saudável')
      return
    } catch (_) {}

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    function createPartner(
      email,
      name,
      role,
      businessName,
      taxId,
      street,
      number,
      neigh,
      zip,
      city,
      state,
      phone,
      lat,
      lng,
    ) {
      const r = new Record(usersCol)
      r.setEmail(email)
      r.setPassword('Skip@Pass')
      r.setVerified(true)
      r.set('name', name)
      r.set('role', role)
      r.set('business_name', businessName)
      r.set('tax_id', taxId)
      r.set('address_street', street)
      r.set('address_number', number)
      r.set('address_neighborhood', neigh)
      r.set('address_zip_code', zip)
      r.set('city', city)
      r.set('state', state)
      r.set('phone', phone)
      r.set('lat', lat)
      r.set('lng', lng)
      r.set('registration_status', 'approved')
      r.set('commission_rate', 10)
      app.save(r)
      return r
    }

    var pharma1 = createPartner(
      'farmacia.vida@vmed.com.br',
      'Farmácia Vida Saudável',
      'pharmacy',
      'Vida Saudável Comércio de Medicamentos Ltda',
      '11222333000144',
      'Av. Paulista',
      '1000',
      'Bela Vista',
      '01310000',
      'São Paulo',
      'SP',
      '1133334444',
      -23.5613,
      -46.6565,
    )

    var pharma2 = createPartner(
      'drogaria.bemestar@vmed.com.br',
      'Drogaria Bem-Estar',
      'pharmacy',
      'Bem-Estar Drogaria e Perfumaria Ltda',
      '22333444000155',
      'R. Augusta',
      '500',
      'Consolação',
      '01304000',
      'São Paulo',
      'SP',
      '1133335555',
      -23.5586,
      -46.6604,
    )

    var lab1 = createPartner(
      'lab.analise@vmed.com.br',
      'Lab Análise Clínica',
      'laboratory',
      'Análise Clínica Diagnósticos Ltda',
      '33444555000166',
      'R. das Laranjeiras',
      '200',
      'Vila Mariana',
      '04012000',
      'São Paulo',
      'SP',
      '1133336666',
      -23.5878,
      -46.6397,
    )

    var lab2 = createPartner(
      'lab.imagem@vmed.com.br',
      'Lab Imagem Diagnóstica',
      'laboratory',
      'Imagem Diagnóstica por Computação Ltda',
      '44555666000177',
      'Av. Brigadeiro Luís Antônio',
      '3000',
      'Jardim Paulista',
      '01402000',
      'São Paulo',
      'SP',
      '1133337777',
      -23.557,
      -46.639,
    )

    var prodCol = app.findCollectionByNameOrId('pharmacy_products')

    function createProduct(pharmacyId, name, description, price) {
      var r = new Record(prodCol)
      r.set('pharmacy_id', pharmacyId)
      r.set('name', name)
      r.set('description', description)
      r.set('price', price)
      r.set('is_promotion', false)
      app.save(r)
    }

    createProduct(lab1.id, 'Hemograma Completo', 'Exame de sangue completo', 45.0)
    createProduct(lab1.id, 'Glicose em Jejum', 'Dosagem de glicose', 25.0)
    createProduct(lab2.id, 'Colesterol Total', 'Perfil lipídico', 35.0)
    createProduct(lab2.id, 'Raio-X Tórax', 'Radiografia de tórax', 120.0)
    createProduct(lab2.id, 'Ultrassonografia Abdominal', 'Ultrassom abdominal total', 180.0)

    createProduct(pharma1.id, 'Dipirona 500mg', 'Analgésico e antitérmico - 20 comprimidos', 8.9)
    createProduct(pharma1.id, 'Paracetamol 750mg', 'Analgésico - 20 comprimidos', 12.5)
    createProduct(pharma2.id, 'Omeprazol 20mg', 'Inibidor de bomba de prótons - 14 cápsulas', 22.0)
    createProduct(pharma2.id, 'Losartana 50mg', 'Anti-hipertensivo - 30 comprimidos', 35.0)
    createProduct(pharma2.id, 'Amoxicilina 500mg', 'Antibiótico - 21 cápsulas', 28.0)

    var patients = []
    try {
      patients = app.findRecordsByFilter('users', 'role = "patient"', '', 10, 0)
    } catch (_) {}

    var professionals = []
    try {
      professionals = app.findRecordsByFilter('users', 'role = "professional"', '', 10, 0)
    } catch (_) {}

    if (patients.length > 0 && professionals.length > 0) {
      var apptCol = app.findCollectionByNameOrId('appointments')

      function createExamAppt(patientId, profId, dateTime) {
        var r = new Record(apptCol)
        r.set('patient_id', patientId)
        r.set('professional_id', profId)
        r.set('dateTime', dateTime)
        r.set('type', 'Presencial')
        r.set('status', 'scheduled')
        r.set('classification', 'exam')
        app.save(r)
        return r
      }

      createExamAppt(patients[0].id, professionals[0].id, '2026-12-01 10:00:00')
      if (patients.length > 1) {
        createExamAppt(patients[1].id, professionals[0].id, '2026-12-02 14:00:00')
      }

      var txCol = app.findCollectionByNameOrId('benefit_transactions')

      function createMedTx(patient, partnerId, amount) {
        var r = new Record(txCol)
        r.set('employee_id', patient.id)
        r.set('company_id', patient.getString('company_id') || patient.id)
        r.set('partner_id', partnerId)
        r.set('amount', amount)
        r.set('type', 'debit')
        r.set('category', 'medication')
        r.set('description', 'Compra de medicamentos')
        r.set('payment_status', 'confirmed')
        app.save(r)
      }

      createMedTx(patients[0], pharma1.id, 21.4)
      if (patients.length > 1) {
        createMedTx(patients[1], pharma2.id, 57.0)
      }
    }
  },
  (app) => {
    var names = [
      'Farmácia Vida Saudável',
      'Drogaria Bem-Estar',
      'Lab Análise Clínica',
      'Lab Imagem Diagnóstica',
    ]
    for (var i = 0; i < names.length; i++) {
      try {
        var r = app.findFirstRecordByData('users', 'name', names[i])
        app.delete(r)
      } catch (_) {}
    }
  },
)
