import { Injectable } from '@angular/core';
import { UserDto } from '../module/login-representation';

const TOKEN_KEY = 'token';
const USER_KEY = 'currentUser';
const AUTH_IDS_KEY = 'authIds';

@Injectable({
  providedIn: 'root',
})
export class UserAuthService {
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setUser(user: UserDto): void {
    const { token, ...safeUser } = user;
    localStorage.setItem(USER_KEY, JSON.stringify({ ...safeUser, token }));
  }

  getUser(): UserDto | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Numeric user primary key from Spring Boot (JWT claim `id`). */
  getUserId(): number | null {
    return this.getUser()?.id ?? null;
  }

  setAuthIds(authIds: Array<number | string>): void {
    const normalized = (Array.isArray(authIds) ? authIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    localStorage.setItem(
      AUTH_IDS_KEY,
      JSON.stringify(Array.from(new Set(normalized))),
    );
  }

  getAuthIds(): number[] {
    const raw = localStorage.getItem(AUTH_IDS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((id: any) => Number(id))
        .filter((id: number) => Number.isFinite(id));
    } catch {
      return [];
    }
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_IDS_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
