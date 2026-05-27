migrate(
  (app) => {
    // Limpar tax_id de usuários que não são entidades B2B válidas, para evitar que
    // CPFs registrados erroneamente como tax_id bloqueiem a criação.
    app
      .db()
      .newQuery(`
    UPDATE users 
    SET tax_id = '' 
    WHERE role NOT IN ('pharmacy', 'laboratory', 'company') 
    AND tax_id IS NOT NULL 
    AND tax_id != ''
  `)
      .execute()

    // Se houver múltiplas farmácias/laboratórios com o mesmo CNPJ (órfãos/duplicatas),
    // manter o primeiro registro para resolver o "duplicate CNPJ loop".
    app
      .db()
      .newQuery(`
    UPDATE users 
    SET tax_id = ''
    WHERE tax_id != '' 
    AND id NOT IN (
      SELECT MIN(id) FROM users WHERE tax_id != '' GROUP BY tax_id
    )
  `)
      .execute()
  },
  (app) => {
    // Revert is impossible for data cleanup
  },
)
