import { createDbClient, type DbClient } from '@recipe-tracker/db';

let db: DbClient | null = null;

export function getDb(): DbClient {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    db = createDbClient(url);
  }
  return db;
}
