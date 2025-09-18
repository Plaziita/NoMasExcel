export type ExpenseStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface Expense {
  id: string;
  cardId: string;
  date: string;
  userName?: string;
  amount: number;
  category: string;
  description?: string;
  status: ExpenseStatus;
  pdfUrl?: string;
}
