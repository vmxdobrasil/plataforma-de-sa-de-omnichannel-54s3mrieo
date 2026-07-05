migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('notification_templates')

    var templates = [
      {
        slug: 'professional_registration_approved',
        name: 'Cadastro de Profissional Aprovado',
        subject: 'Cadastro Aprovado - V MED Brasil',
        body_text:
          'Olá {{name}},\n\nSeu cadastro como profissional de {{specialty}} foi aprovado com sucesso! Seu status atual é: {{status}}.\n\nBem-vindo à plataforma V MED Brasil. Você já pode começar a atender pacientes.\n\nAtenciosamente,\nEquipe V MED Brasil',
        body_html:
          '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0"><div style="background-color:#14805A;padding:24px;text-align:center"><h1 style="color:#F7B52C;margin:0;font-size:24px">V MED Brasil</h1></div><div style="padding:30px;background-color:#ffffff"><p>Olá <strong>{{name}}</strong>,</p><p>Seu cadastro como profissional de <strong>{{specialty}}</strong> foi aprovado com sucesso!</p><p>Status atual: <strong>{{status}}</strong></p><p>Bem-vindo à plataforma V MED Brasil. Você já pode começar a atender pacientes.</p></div><div style="background-color:#14805A;padding:16px;text-align:center"><p style="color:#ffffff;margin:0;font-size:12px">© 2026 V MED Brasil. Todos os direitos reservados.</p></div></div>',
        type: 'both',
        is_active: true,
      },
      {
        slug: 'professional_registration_rejected',
        name: 'Cadastro de Profissional Rejeitado',
        subject: 'Atualização de Cadastro - V MED Brasil',
        body_text:
          'Olá {{name}},\n\nInformamos que seu cadastro não foi aprovado neste momento. Status: {{status}}.\n\nPara mais detalhes, entre em contato com nossa equipe através da plataforma.\n\nAtenciosamente,\nEquipe V MED Brasil',
        body_html:
          '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0"><div style="background-color:#14805A;padding:24px;text-align:center"><h1 style="color:#F7B52C;margin:0;font-size:24px">V MED Brasil</h1></div><div style="padding:30px;background-color:#ffffff"><p>Olá <strong>{{name}}</strong>,</p><p>Informamos que seu cadastro não foi aprovado neste momento.</p><p>Status: <strong>{{status}}</strong></p><p>Para mais detalhes, entre em contato com nossa equipe através da plataforma.</p></div><div style="background-color:#14805A;padding:16px;text-align:center"><p style="color:#ffffff;margin:0;font-size:12px">© 2026 V MED Brasil. Todos os direitos reservados.</p></div></div>',
        type: 'both',
        is_active: true,
      },
      {
        slug: 'crm_verification_failed',
        name: 'Falha na Verificação de CRM',
        subject: 'Verificação de CRM - Documentação Necessária',
        body_text:
          'Olá {{name}},\n\nSua verificação de CRM (nº {{crm}}) falhou. Por favor, envie a documentação atualizada para reativação do seu perfil na plataforma V MED Brasil.\n\nAtenciosamente,\nEquipe V MED Brasil',
        body_html:
          '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0"><div style="background-color:#14805A;padding:24px;text-align:center"><h1 style="color:#F7B52C;margin:0;font-size:24px">V MED Brasil</h1></div><div style="padding:30px;background-color:#ffffff"><p>Olá <strong>{{name}}</strong>,</p><p>Sua verificação de CRM (nº <strong>{{crm}}</strong>) falhou.</p><p>Por favor, envie a documentação atualizada para reativação do seu perfil na plataforma V MED Brasil.</p></div><div style="background-color:#14805A;padding:16px;text-align:center"><p style="color:#ffffff;margin:0;font-size:12px">© 2026 V MED Brasil. Todos os direitos reservados.</p></div></div>',
        type: 'both',
        is_active: true,
      },
      {
        slug: 'professional_welcome',
        name: 'Boas-vindas ao Profissional',
        subject: 'Bem-vindo ao V MED Brasil',
        body_text:
          'Olá {{name}},\n\nBem-vindo à plataforma V MED Brasil! Complete seu perfil para começar a atender pacientes.\n\nAtenciosamente,\nEquipe V MED Brasil',
        body_html:
          '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0"><div style="background-color:#14805A;padding:24px;text-align:center"><h1 style="color:#F7B52C;margin:0;font-size:24px">V MED Brasil</h1></div><div style="padding:30px;background-color:#ffffff"><p>Olá <strong>{{name}}</strong>,</p><p>Bem-vindo à plataforma V MED Brasil!</p><p>Complete seu perfil para começar a atender pacientes.</p></div><div style="background-color:#14805A;padding:16px;text-align:center"><p style="color:#ffffff;margin:0;font-size:12px">© 2026 V MED Brasil. Todos os direitos reservados.</p></div></div>',
        type: 'email',
        is_active: true,
      },
    ]

    templates.forEach(function (t) {
      try {
        app.findFirstRecordByData('notification_templates', 'slug', t.slug)
      } catch (_) {
        var record = new Record(col)
        record.set('slug', t.slug)
        record.set('name', t.name)
        record.set('subject', t.subject)
        record.set('body_text', t.body_text)
        record.set('body_html', t.body_html)
        record.set('type', t.type)
        record.set('is_active', t.is_active)
        app.save(record)
      }
    })
  },
  (app) => {
    var slugs = [
      'professional_registration_approved',
      'professional_registration_rejected',
      'crm_verification_failed',
      'professional_welcome',
    ]
    slugs.forEach(function (slug) {
      try {
        var record = app.findFirstRecordByData('notification_templates', 'slug', slug)
        app.delete(record)
      } catch (_) {}
    })
  },
)
