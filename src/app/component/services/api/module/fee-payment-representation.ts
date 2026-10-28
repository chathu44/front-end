export interface FeePaymentRepresentation {
  id?: string | number;
  paymentDate?: string;
  amount?: number | string;
  paymentMethod?: string;
  referenceNo?: string;
  
  invoice?: any;
  receivedBy?: any;
  status?: any;
}