import type { LineItem } from '../types';

export function calcSubtotal(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}

export function calcTotals(items: LineItem[], taxRate: number, discountRate: number) {
  const subtotal = calcSubtotal(items);
  const discount = subtotal * (discountRate / 100);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;
  return { subtotal, discount, taxable, tax, total };
}
