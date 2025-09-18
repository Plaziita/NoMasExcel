import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Expense as ExpenseModel } from '../../models/Expense';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private baseUrl = 'http://localhost:8080/api/expenses';
  constructor(private http: HttpClient) {}

  list(status?: string): Observable<ExpenseModel[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    const options: { params?: HttpParams; withCredentials: boolean } = { withCredentials: true };
    if (params) options.params = params;
    return this.http
      .get<any>(this.baseUrl, options as any)
      .pipe(map((r) => r as unknown as ExpenseModel[]));
  }

  create(expense: ExpenseModel): Observable<ExpenseModel> {
    return this.http.post<ExpenseModel>(this.baseUrl, expense, { withCredentials: true });
  }

  update(id: string, expense: Partial<ExpenseModel>): Observable<ExpenseModel> {
    return this.http.put<ExpenseModel>(`${this.baseUrl}/${id}`, expense, { withCredentials: true });
  }

  delete(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
