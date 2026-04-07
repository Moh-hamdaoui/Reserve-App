import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

const STORAGE_TOKEN_KEY = 'reserve_app_auth_token';
const STORAGE_USER_KEY = 'reserve_app_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(null);
  readonly isAuthenticated = signal(false);

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const userJson = localStorage.getItem(STORAGE_USER_KEY);

    if (token && userJson) {
      this.token.set(token);
      this.user.set(JSON.parse(userJson) as AuthUser);
      this.isAuthenticated.set(true);
    } else {
      this.clearSession();
    }
  }

  private persistSession(response: AuthResponse): void {
    this.token.set(response.accessToken);
    this.user.set(response.user);
    this.isAuthenticated.set(true);
    localStorage.setItem(STORAGE_TOKEN_KEY, response.accessToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.user));
  }

  private clearSession(): void {
    this.token.set(null);
    this.user.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }

  login(credentials: AuthCredentials): Observable<boolean> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      map(response => {
        this.persistSession(response);
        return true;
      }),
      catchError(error => this.handleError(error))
    );
  }

  register(credentials: RegisterCredentials): Observable<boolean> {
    return this.http.post<AuthResponse>('/api/auth/register', credentials).pipe(
      map(response => {
        this.persistSession(response);
        return true;
      }),
      catchError(error => this.handleError(error))
    );
  }

  logout(): void {
    this.clearSession();
  }

  getAuthorizationHeader(): string | null {
    return this.token() ? `Bearer ${this.token()}` : null;
  }

  refreshToken(): Observable<boolean> {
    const currentToken = this.token();
    if (!currentToken) {
      return of(false);
    }

    return this.http.post<AuthResponse>('/api/auth/refresh', { token: currentToken }).pipe(
      map(response => {
        this.persistSession(response);
        return true;
      }),
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('AuthService error', error);
    return throwError(() => new Error(error.error?.message ?? 'Erreur d’authentification'));
  }
}
