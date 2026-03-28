import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Document, LineItem } from '../types';
import { calcTotals } from './totals';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function exportDocumentPdf(doc: Document, items: LineItem[]): Promise<void> {
  const totals = calcTotals(items, doc.taxRate, doc.discountRate);

  const html = `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, Arial; padding: 24px; color: #111; }
        .row { display: flex; justify-content: space-between; align-items: baseline; }
        h1 { margin: 0 0 6px 0; font-size: 22px; }
        .muted { color: #555; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 12px; }
        th { text-align: left; background: #f8fafc; }
        td.num { text-align: right; }
        .totals { margin-top: 16px; width: 280px; margin-left: auto; }
        .totals td { border: none; padding: 6px; }
        .grand { font-weight: 700; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="row">
        <div>
          <h1>${doc.type === 'quote' ? 'Quote' : 'Invoice'} ${esc(doc.number)}</h1>
          <div class="muted">Date: ${esc(new Date(doc.createdAt).toLocaleString())}</div>
          <div class="muted">Customer: ${esc(doc.customerName || '—')}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40%">Item</th>
            <th style="width: 10%">Qty</th>
            <th style="width: 15%">Unit</th>
            <th style="width: 15%" class="num">Unit Price</th>
            <th style="width: 20%" class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (i) => `
            <tr>
              <td>${esc(i.name)}</td>
              <td class="num">${i.qty}</td>
              <td>${esc(i.unitName)}</td>
              <td class="num">${i.unitPrice}</td>
              <td class="num">${(i.qty * i.unitPrice).toFixed(2)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <table class="totals">
        <tr><td>Subtotal</td><td class="num">${totals.subtotal.toFixed(2)} ${esc(doc.currency)}</td></tr>
        <tr><td>Discount (${doc.discountRate}%)</td><td class="num">-${totals.discount.toFixed(2)} ${esc(doc.currency)}</td></tr>
        <tr><td>Tax (${doc.taxRate}%)</td><td class="num">${totals.tax.toFixed(2)} ${esc(doc.currency)}</td></tr>
        <tr><td class="grand">Total</td><td class="num grand">${totals.total.toFixed(2)} ${esc(doc.currency)}</td></tr>
      </table>

      ${doc.notes ? `<p class="muted">Notes: ${esc(doc.notes)}</p>` : ''}
    </body>
  </html>`;

  const file = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
}
