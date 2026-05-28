migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    // 1. Remove the old unique index if it exists to prevent conflicts during normalization
    try {
      col.removeIndex('idx_users_tax_id')
    } catch (_) {}

    // 2. Normalize all existing tax_id fields to be strictly numeric
    app
      .db()
      .newQuery(`
    UPDATE users 
    SET tax_id = REPLACE(REPLACE(REPLACE(REPLACE(tax_id, '.', ''), '-', ''), '/', ''), ' ', '')
    WHERE tax_id IS NOT NULL AND tax_id != ''
  `)
      .execute()

    // 3. Remove duplicates by keeping only the oldest record for each tax_id
    app
      .db()
      .newQuery(`
    DELETE FROM users WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tax_id ORDER BY created ASC) as rn
        FROM users
        WHERE tax_id IS NOT NULL AND tax_id != ''
      ) WHERE rn > 1
    )
  `)
      .execute()

    // 4. Re-add the unique index on the cleaned data
    col.addIndex('idx_users_tax_id', true, 'tax_id', "tax_id != ''")

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    try {
      col.removeIndex('idx_users_tax_id')
    } catch (_) {}
    app.save(col)
  },
)
