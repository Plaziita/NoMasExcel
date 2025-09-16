import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/User';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/users';
  private authUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

  register(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.authUrl}/register`, userData, { withCredentials: true });
  }

  login(loginData: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.authUrl}/login`, loginData, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.authUrl}/logout`, {}, { withCredentials: true });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}`, { withCredentials: true });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, userData, { withCredentials: true });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.authUrl}/me`, { withCredentials: true });
  }
}
