export type ExpenseStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface Expense {
  id: string;
  cardId: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  status: ExpenseStatus;
  pdfUrl?: string;
}
