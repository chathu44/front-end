import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserAuthService } from './user-auth.service';
import {
  LoginRepresentation,
  RegisterRepresentation,
  UserDto
} from '../module/login-representation';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly baseUrl = environment.apiUrl;
  private readonly noAuthHeaders = new HttpHeaders({ 'No-Auth': 'True' });

  constructor(
    private httpClient: HttpClient,
    private userAuthService: UserAuthService
  ) { }

  logout(): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.userAuthService.clear())
    );
  }

  login(loginData: LoginRepresentation): Observable<UserDto> {
    return this.httpClient.post<UserDto>(
      `${this.baseUrl}/login`,
      loginData,
      { headers: this.noAuthHeaders }
    ).pipe(
      tap((user) => this.persistSession(user))
    );
  }

  register(data: RegisterRepresentation): Observable<UserDto> {
    return this.httpClient.post<UserDto>(
      `${this.baseUrl}/register`,
      data,
      { headers: this.noAuthHeaders }
    );
  }

  getAuthIds(userId: number): Observable<number[]> {
    return this.httpClient.get<number[]>(`${this.baseUrl}/get-auth-ids/${userId}`).pipe(
      tap((ids) => this.userAuthService.setAuthIds(ids))
    );
  }

  private persistSession(user: UserDto): void {
    if (user?.token) {
      this.userAuthService.setToken(user.token);
      this.userAuthService.setUser(user);
    }
  }
}
