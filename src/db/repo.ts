import { getDb } from './db';
import type { Customer, Document, DocumentStatus, DocumentType, LineItem, Unit } from '../types';

function toIsoNow(): string {
  return new Date().toISOString();
}

export async function listUnits(): Promise<Unit[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; name: string; is_default: number }>(
    'SELECT id, name, is_default FROM units ORDER BY is_default DESC, name ASC'
  );
  return rows.map((r) => ({ id: r.id, name: r.name, isDefault: !!r.is_default }));
}

export async function addUnit(name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO units (name, is_default) VALUES (?, 0)', [name.trim()]);
}

export async function deleteUnit(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM units WHERE id = ? AND is_default = 0', [id]);
}

export async function listCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Customer>('SELECT id, name, phone, email FROM customers ORDER BY name ASC');
  return rows;
}

export async function upsertCustomer(customer: Omit<Customer, 'id'> & { id?: number }): Promise<number> {
  const db = await getDb();
  if (customer.id) {
    await db.runAsync('UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?', [
      customer.name.trim(),
      customer.phone ?? null,
      customer.email ?? null,
      customer.id,
    ]);
    return customer.id;
  }
  const res = await db.runAsync('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)', [
    customer.name.trim(),
    customer.phone ?? null,
    customer.email ?? null,
  ]);
  return Number(res.lastInsertRowId);
}

export async function listDocuments(): Promise<Document[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT id, type, number, customer_id as customerId, customer_name as customerName, created_at as createdAt, notes, status, currency, tax_rate as taxRate, discount_rate as discountRate FROM documents ORDER BY id DESC'
  );
  return rows;
}

export async function getDocument(id: number): Promise<Document | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT id, type, number, customer_id as customerId, customer_name as customerName, created_at as createdAt, notes, status, currency, tax_rate as taxRate, discount_rate as discountRate FROM documents WHERE id = ?',
    [id]
  );
  return row ?? null;
}

export async function createDocument(type: DocumentType): Promise<number> {
  const db = await getDb();
  const prefix = type === 'quote' ? 'Q' : 'I';
  const now = new Date();
  const number = `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  const res = await db.runAsync(
    'INSERT INTO documents (type, number, created_at, status, currency, tax_rate, discount_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [type, number, toIsoNow(), 'draft', 'XAF', 0, 0]
  );
  return Number(res.lastInsertRowId);
}

export async function updateDocument(doc: Partial<Document> & { id: number }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE documents SET type = COALESCE(?, type), customer_id = ?, customer_name = ?, notes = ?, status = COALESCE(?, status), currency = COALESCE(?, currency), tax_rate = COALESCE(?, tax_rate), discount_rate = COALESCE(?, discount_rate) WHERE id = ?',
    [
      doc.type ?? null,
      doc.customerId ?? null,
      doc.customerName ?? null,
      doc.notes ?? null,
      (doc.status as DocumentStatus | undefined) ?? null,
      doc.currency ?? null,
      doc.taxRate ?? null,
      doc.discountRate ?? null,
      doc.id,
    ]
  );
}

export async function deleteDocument(id: number): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM line_items WHERE document_id = ?', [id]);
    await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
  });
}

export async function listLineItems(documentId: number): Promise<LineItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT id, document_id as documentId, name, qty, unit_id as unitId, unit_name as unitName, unit_price as unitPrice, category FROM line_items WHERE document_id = ? ORDER BY id ASC',
    [documentId]
  );
  return rows;
}

export async function addLineItem(documentId: number, item: Omit<LineItem, 'id' | 'documentId'>): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO line_items (document_id, name, qty, unit_id, unit_name, unit_price, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      documentId,
      item.name.trim(),
      item.qty,
      item.unitId,
      item.unitName,
      item.unitPrice,
      item.category ?? null,
    ]
  );
  return Number(res.lastInsertRowId);
}

export async function updateLineItem(item: Partial<LineItem> & { id: number }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE line_items SET name = COALESCE(?, name), qty = COALESCE(?, qty), unit_id = COALESCE(?, unit_id), unit_name = COALESCE(?, unit_name), unit_price = COALESCE(?, unit_price), category = ? WHERE id = ?',
    [
      item.name ?? null,
      item.qty ?? null,
      item.unitId ?? null,
      item.unitName ?? null,
      item.unitPrice ?? null,
      item.category ?? null,
      item.id,
    ]
  );
}

export async function deleteLineItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM line_items WHERE id = ?', [id]);
}
