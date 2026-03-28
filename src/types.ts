export type DocumentType = 'quote' | 'invoice';

export type Unit = {
  id: number;
  name: string;
  isDefault: boolean;
};

export type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
};

export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export type Document = {
  id: number;
  type: DocumentType;
  number: string;
  customerId?: number | null;
  customerName?: string | null;
  createdAt: string;
  notes?: string | null;
  status: DocumentStatus;
  currency: string;
  taxRate: number; // percent
  discountRate: number; // percent
};

export type LineItem = {
  id: number;
  documentId: number;
  name: string;
  qty: number;
  unitId: number;
  unitName: string;
  unitPrice: number;
  category?: string | null;
};
