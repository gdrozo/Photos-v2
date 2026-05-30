import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

async function getDb() {
  if (!db) {
    db = await Database.load('sqlite:photos.db')
    // Ensure table exists (though backend also does it)
    await db.execute(
      'CREATE TABLE IF NOT EXISTS ratings (path TEXT PRIMARY KEY, rating INTEGER)'
    )
  }
  return db
}

export async function setRating(path: string, rating: number) {
  const database = await getDb()
  await database.execute(
    'INSERT OR REPLACE INTO ratings (path, rating) VALUES ($1, $2)',
    [path, rating]
  )
}

export async function getRating(path: string): Promise<number> {
  const database = await getDb()
  const result = await database.select<{ rating: number }[]>(
    'SELECT rating FROM ratings WHERE path = $1',
    [path]
  )
  return result[0]?.rating ?? 0
}
