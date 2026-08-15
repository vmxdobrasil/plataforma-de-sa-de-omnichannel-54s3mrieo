/// Adiciona campos financeiros à collection `appointments` para a
/// integração V MED BRASIL -> GestãoMed:
///   valor            (number)  - valor da consulta em R$
///   forma_pagamento   (select)  - PIX | cartao | transferencia | dinheiro | boleto
///   status_pagamento  (select)  - Pago | Aguardando
///   repasse_pct       (number)  - percentual de repasse para a plataforma
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('appointments')

    if (!col.fields.getByName('valor')) {
      col.fields.add(new NumberField({ name: 'valor', min: 0 }))
    }
    if (!col.fields.getByName('forma_pagamento')) {
      col.fields.add(
        new SelectField({
          name: 'forma_pagamento',
          values: ['PIX', 'cartao', 'transferencia', 'dinheiro', 'boleto'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('status_pagamento')) {
      col.fields.add(
        new SelectField({
          name: 'status_pagamento',
          values: ['Pago', 'Aguardando'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('repasse_pct')) {
      col.fields.add(new NumberField({ name: 'repasse_pct', min: 0, max: 100 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('appointments')
    ;['valor', 'forma_pagamento', 'status_pagamento', 'repasse_pct'].forEach((name) => {
      const f = col.fields.getByName(name)
      if (f) col.fields.remove(f)
    })
    app.save(col)
  },
)
