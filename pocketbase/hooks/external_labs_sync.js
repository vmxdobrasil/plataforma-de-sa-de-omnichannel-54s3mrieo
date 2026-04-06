routerAdd(
  'GET',
  '/backend/v1/external-labs/{patientId}',
  (e) => {
    const auth = e.auth
    if (!auth) {
      throw new UnauthorizedError('Não autorizado.')
    }

    if (auth.get('role') !== 'professional') {
      throw new ForbiddenError('Apenas profissionais podem acessar esta rota.')
    }

    const crmNumber = auth.get('crm_number')
    const crmState = auth.get('crm_state')

    if (!crmNumber || !crmState) {
      throw new BadRequestError('Profissional sem CRM cadastrado.')
    }

    const patientId = e.request.pathValue('patientId')
    let patient
    try {
      patient = $app.findRecordById('users', patientId)
    } catch (_) {
      throw new NotFoundError('Paciente não encontrado.')
    }

    if (!patient.get('allow_external_sync')) {
      throw new ForbiddenError('Paciente não autorizou a sincronização.')
    }

    if (!patient.get('document_id')) {
      throw new BadRequestError('Paciente sem CPF/Documento cadastrado.')
    }

    // Mock data simulation for external labs integration
    const labs = [
      {
        id: 'ext_' + $security.randomString(8),
        title: 'Hemograma Completo',
        date: new Date().toISOString().split('T')[0],
        laboratory: 'Laboratório Fleury',
        content:
          'Hemácias: 4.8 milhões/mm3\nLeucócitos: 7500/mm3\nPlaquetas: 280000/mm3\n\nConclusão: Valores dentro da normalidade.',
      },
      {
        id: 'ext_' + $security.randomString(8),
        title: 'Ressonância Magnética do Joelho',
        date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
        laboratory: 'Cura Imagem',
        content:
          'Laudo: Meniscos íntegros. Ligamentos cruzados sem alterações. Cartilagem preservada. Ausência de derrame articular significativo.',
      },
      {
        id: 'ext_' + $security.randomString(8),
        title: 'Glicemia de Jejum',
        date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        laboratory: 'Sabin Diagnósticos',
        content: 'Glicemia: 92 mg/dL\nValores de referência: 70 a 99 mg/dL.',
      },
    ]

    return e.json(200, { labs })
  },
  $apis.requireAuth(),
)
