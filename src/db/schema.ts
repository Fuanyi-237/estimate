export const DB_NAME = 'smartquote.db';

export const DEFAULT_UNITS: string[] = [
  'item',
  'bag',
  'litre',
  'bucket',
  'kg',
  'ton',
  'meter',
  'm²',
  'm³',
  'hour',
  'day',
  'trip',
];

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  number TEXT NOT NULL,
  customer_id INTEGER,
  customer_name TEXT,
  created_at TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  tax_rate REAL NOT NULL,
  discount_rate REAL NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  qty REAL NOT NULL,
  unit_id INTEGER NOT NULL,
  unit_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  category TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE INDEX IF NOT EXISTS idx_line_items_document_id ON line_items(document_id);
`;
