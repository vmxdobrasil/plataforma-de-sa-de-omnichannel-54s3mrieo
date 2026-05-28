migrate((app) => {
  app
    .db()
    .newQuery(`
    UPDATE users 
    SET tax_id = REPLACE(REPLACE(REPLACE(tax_id, '.', ''), '-', ''), '/', '')
    WHERE tax_id IS NOT NULL AND tax_id != ''
  `)
    .execute()
})
