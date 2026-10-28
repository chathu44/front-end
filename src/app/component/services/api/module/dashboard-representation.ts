export interface DashboardRepresentation { 
id?: string | number;
  recipientId?: string | number | null;
  recipientType?: 'Parent' | 'Staff' | string;
  message?: string;
  type?: string;
  sentDate?: string;
  readStatus?: boolean;
}
