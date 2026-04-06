migrate(
  (app) => {
    const productsCol = app.findCollectionByNameOrId('products')

    const products = [
      {
        name: 'V MED Academy: Marketing 101',
        description: 'Aprenda o básico de marketing para atrair mais pacientes para sua clínica.',
        price: 199.99,
        category: 'course',
      },
      {
        name: 'V MED Academy: Gestão Clínica',
        description: 'Otimize os processos e a gestão financeira do seu consultório.',
        price: 249.0,
        category: 'course',
      },
      {
        name: 'V MED Scribe',
        description: 'Assistente de transcrição de consultas em tempo real com IA.',
        price: 99.9,
        category: 'agent',
      },
      {
        name: 'V MED Social AI',
        description: 'Criação automatizada de conteúdo para redes sociais, posts e roteiros.',
        price: 149.9,
        category: 'agent',
      },
      {
        name: 'Premium Mentorship',
        description:
          'Consultoria exclusiva e acompanhamento com especialistas em crescimento de marca.',
        price: 999.0,
        category: 'mentorship',
      },
      {
        name: 'Brand Design Service',
        description: 'Criação de identidade visual completa pela nossa agência.',
        price: 1500.0,
        category: 'service',
      },
    ]

    for (const p of products) {
      try {
        app.findFirstRecordByData('products', 'name', p.name)
      } catch (_) {
        const record = new Record(productsCol)
        record.set('name', p.name)
        record.set('description', p.description)
        record.set('price', p.price)
        record.set('category', p.category)
        app.save(record)
      }
    }
  },
  (app) => {
    const names = [
      'V MED Academy: Marketing 101',
      'V MED Academy: Gestão Clínica',
      'V MED Scribe',
      'V MED Social AI',
      'Premium Mentorship',
      'Brand Design Service',
    ]
    for (const name of names) {
      try {
        const record = app.findFirstRecordByData('products', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
