export interface FeeInvoiceRepresentation {
  id?: string | number;
  invoiceCode?: string;
  billingMonth?: string;
  amount?: number | string;
  dueDate?: string | null;
  
  child?: any;
  enrollment?: any;
  parent?: any;
  status?: any;
}