import * as SQLite from 'expo-sqlite';
import { DB_NAME, DEFAULT_UNITS, SCHEMA_SQL } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME, {
      enableChangeListener: false,
    });
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM units'
  );
  const count = row?.count ?? 0;
  if (count === 0) {
    await db.withTransactionAsync(async () => {
      for (const name of DEFAULT_UNITS) {
        await db.runAsync(
          'INSERT INTO units (name, is_default) VALUES (?, 1)',
          [name]
        );
      }
    });
  }
}
