import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from '../../models/Card';

@Injectable({ providedIn: 'root' })
export class CardService {
  deleteCard(cardId: string) {
    return this.http.delete(`${this.baseUrl}/${cardId}`, { withCredentials: true });
  }
  private baseUrl = 'http://localhost:8080/api/cards';

  constructor(private http: HttpClient) {}

  addCard(cardData: any): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}`, cardData, { withCredentials: true });
  }

  getAllCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.baseUrl}`, { withCredentials: true });
  }

  updateCard(cardId: string, cardData: any): Observable<Card> {
    return this.http.put<Card>(`${this.baseUrl}/${cardId}`, cardData, { withCredentials: true });
  }
}
