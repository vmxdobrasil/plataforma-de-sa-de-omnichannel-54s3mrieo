migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var apptsCol = app.findCollectionByNameOrId('appointments')
    var slotsCol = app.findCollectionByNameOrId('availability_slots')

    var seedUser = function (email, data) {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {}
      var r = new Record(usersCol)
      r.setEmail(email)
      r.setPassword('Skip@Pass')
      r.setVerified(true)
      Object.keys(data).forEach(function (k) {
        r.set(k, data[k])
      })
      app.save(r)
      return r
    }

    var p1 = seedUser('ana.silva@clinic.com.br', {
      name: 'Ana Beatriz Souza Silva',
      role: 'patient',
      document_id: '12345678901',
      rg: '12.345.678-9',
      date_of_birth: '1990-05-15',
      gender: 'female',
      phone: '(11) 98765-4321',
      blood_type: 'O+',
      allergies: 'Penicilina',
      continuous_medications: 'Losartana 50mg',
      address_street: 'Av. Paulista',
      address_number: '1000',
      address_neighborhood: 'Bela Vista',
      address_zip_code: '01310-100',
      city: 'São Paulo',
      state: 'SP',
      emergency_contact_name: 'Marcos Silva',
      emergency_contact_phone: '(11) 91234-5678',
      payment_method: 'private',
      registration_status: 'approved',
    })
    var p2 = seedUser('carlos.lima@clinic.com.br', {
      name: 'Carlos Eduardo Lima Ferreira',
      role: 'patient',
      document_id: '98765432109',
      rg: '98.765.432-1',
      date_of_birth: '1985-03-22',
      gender: 'male',
      phone: '(21) 97654-3210',
      blood_type: 'A+',
      allergies: '',
      continuous_medications: 'Metformina 500mg',
      address_street: 'Rua das Flores',
      address_number: '250',
      address_neighborhood: 'Centro',
      address_zip_code: '20010-010',
      city: 'Rio de Janeiro',
      state: 'RJ',
      emergency_contact_name: 'Sofia Lima',
      emergency_contact_phone: '(21) 97612-3456',
      payment_method: 'corporate',
      registration_status: 'approved',
    })
    var p3 = seedUser('mariana.alves@clinic.com.br', {
      name: 'Mariana Costa Alves',
      role: 'patient',
      document_id: '45678912304',
      rg: '45.678.912-3',
      date_of_birth: '1995-11-08',
      gender: 'female',
      phone: '(31) 96543-2109',
      blood_type: 'B-',
      allergies: 'Dipirona',
      continuous_medications: '',
      address_street: 'Av. Afonso Pena',
      address_number: '5000',
      address_neighborhood: 'Funcionários',
      address_zip_code: '30130-000',
      city: 'Belo Horizonte',
      state: 'MG',
      emergency_contact_name: 'Paulo Alves',
      emergency_contact_phone: '(31) 96512-7890',
      payment_method: 'pix',
      registration_status: 'pending',
    })
    var p4 = seedUser('pedro.santos@clinic.com.br', {
      name: 'Pedro Henrique Santos Oliveira',
      role: 'patient',
      document_id: '32165498712',
      rg: '32.165.498-7',
      date_of_birth: '2000-07-30',
      gender: 'male',
      phone: '(41) 95432-1098',
      blood_type: 'AB+',
      allergies: '',
      continuous_medications: '',
      address_street: 'Rua XV de Novembro',
      address_number: '1299',
      address_neighborhood: 'Centro',
      address_zip_code: '80060-000',
      city: 'Curitiba',
      state: 'PR',
      emergency_contact_name: 'Helena Santos',
      emergency_contact_phone: '(41) 95412-3456',
      payment_method: 'credit_card',
      registration_status: 'approved',
    })

    var d1 = seedUser('beatriz.almeida@clinic.com.br', {
      name: 'Dra. Beatriz Almeida Costa',
      role: 'professional',
      specialty: 'Dermatologia',
      sub_specialty: 'Dermatologia Estética',
      crm_number: '12345',
      crm_state: 'SP',
      rqe: '67890',
      consultation_value: 250,
      professional_status: 'active',
      bio: 'Dermatologista com 10 anos de experiência em estética.',
      phone: '(11) 98888-7777',
      is_verified: true,
      registration_status: 'approved',
    })
    var d2 = seedUser('rafael.mendes@clinic.com.br', {
      name: 'Dr. Rafael Mendes Cruz',
      role: 'professional',
      specialty: 'Cardiologia',
      crm_number: '67890',
      crm_state: 'RJ',
      rqe: '11111',
      consultation_value: 300,
      professional_status: 'active',
      bio: 'Cardiologista e intensivista.',
      phone: '(21) 97777-6666',
      is_verified: true,
      registration_status: 'approved',
    })
    var d3 = seedUser('juliana.rocha@clinic.com.br', {
      name: 'Dra. Juliana Rocha Lima',
      role: 'professional',
      specialty: 'Pediatria',
      crm_number: '54321',
      crm_state: 'MG',
      rqe: '22222',
      consultation_value: 200,
      professional_status: 'vacation',
      bio: 'Pediatra com foco em cuidado preventivo.',
      phone: '(31) 96666-5555',
      is_verified: true,
      registration_status: 'approved',
    })

    seedUser('maria.ferreira@clinic.com.br', {
      name: 'Maria Aparecida Ferreira',
      role: 'admin',
      work_shift: 'morning',
      phone: '(11) 95555-4444',
      registration_status: 'approved',
    })
    seedUser('joao.batista@clinic.com.br', {
      name: 'João Batista Silva',
      role: 'medical_director',
      work_shift: 'business',
      phone: '(11) 94444-3333',
      registration_status: 'approved',
    })

    var seedSlot = function (profId, day, start, end, type, duration) {
      var existing = app.findRecordsByFilter(
        'availability_slots',
        'professional_id = "' +
          profId +
          '" && day_of_week = "' +
          day +
          '" && start_time = "' +
          start +
          '"',
        '',
        1,
        0,
      )
      if (existing.length > 0) return
      var s = new Record(slotsCol)
      s.set('professional_id', profId)
      s.set('day_of_week', day)
      s.set('start_time', start)
      s.set('end_time', end)
      s.set('slot_type', type)
      s.set('slot_duration', duration || 30)
      app.save(s)
    }

    ;['1', '2', '3', '4', '5'].forEach(function (d) {
      seedSlot(d1.id, d, '08:00', '12:00', 'Presencial', 30)
    })
    ;['1', '2', '4'].forEach(function (d) {
      seedSlot(d2.id, d, '13:00', '18:00', 'Online', 45)
    })
    ;['1', '3', '5'].forEach(function (d) {
      seedSlot(d3.id, d, '08:00', '12:00', 'Presencial', 30)
    })

    var tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    var tomorrow1030 = new Date(tomorrow)
    tomorrow1030.setHours(10, 30, 0, 0)
    var tomorrow1400 = new Date(tomorrow)
    tomorrow1400.setHours(14, 0, 0, 0)
    var nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(11, 0, 0, 0)

    var seedAppt = function (pid, profid, dt, type, status, classification, notes) {
      try {
        app.findFirstRecordByData('appointments', 'patient_id', pid)
      } catch (_) {}
      var a = new Record(apptsCol)
      a.set('patient_id', pid)
      a.set('professional_id', profid)
      a.set('dateTime', dt.toISOString())
      a.set('type', type)
      a.set('status', status)
      a.set('classification', classification)
      if (notes) a.set('notes', notes)
      app.save(a)
    }

    seedAppt(
      p1.id,
      d1.id,
      tomorrow,
      'Presencial',
      'scheduled',
      'first_visit',
      'Primeira consulta - avaliação dermatológica',
    )
    seedAppt(p2.id, d2.id, tomorrow1030, 'Online', 'scheduled', 'follow_up', 'Retorno cardiológico')
    seedAppt(
      p4.id,
      d1.id,
      tomorrow1400,
      'Presencial',
      'scheduled',
      'emergency',
      'Urgência - lesão cutânea',
    )
    seedAppt(
      p3.id,
      d3.id,
      nextWeek,
      'Presencial',
      'scheduled',
      'first_visit',
      'Primeira consulta pediátrica',
    )
  },
  (app) => {
    ;[
      'ana.silva@clinic.com.br',
      'carlos.lima@clinic.com.br',
      'mariana.alves@clinic.com.br',
      'pedro.santos@clinic.com.br',
      'beatriz.almeida@clinic.com.br',
      'rafael.mendes@clinic.com.br',
      'juliana.rocha@clinic.com.br',
      'maria.ferreira@clinic.com.br',
      'joao.batista@clinic.com.br',
    ].forEach(function (email) {
      try {
        app.delete(app.findAuthRecordByEmail('_pb_users_auth_', email))
      } catch (_) {}
    })
    try {
      var slots = app.findRecordsByFilter('availability_slots', '1 = 1', '', 500, 0)
      slots.forEach(function (s) {
        app.delete(s)
      })
    } catch (_) {}
  },
)
