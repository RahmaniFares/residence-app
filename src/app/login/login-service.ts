import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

// --- DTOs matching backend API ---

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
}

export interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    avatarUrl: string;
    residentId?: string;
    resident?: any;
  };
}

// --- Legacy interfaces (kept for backward compatibility with components) ---

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;

}

export interface LoginRequest {
  emailOrApartment: string;
  password: string;
  rememberMe?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Login via backend API.
   * Maps the legacy LoginRequest to the backend's LoginDto format.
   */
  Login(loginRequest: LoginRequest): Observable<AuthResponseDto> {
    const loginDto: LoginDto = {
      email: loginRequest.emailOrApartment,
      password: loginRequest.password
    };

    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, loginDto).pipe(
      tap(response => {
        this.saveTokens(response.accessToken, response.refreshToken);
        const user = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          fullName: `${response.user.firstName} ${response.user.lastName}`,
          phoneNumber: response.user.phoneNumber,
          role: response.user.role,
          avatarUrl: response.user.avatarUrl,
          residentId: response.user.residentId,
          resident: response.user.resident
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Register via backend API.
   * Maps the legacy RegisterRequest to the backend's CreateUserDto format.
   */
  Register(registerRequest: RegisterRequest): Observable<AuthResponseDto> {
    const createUserDto: CreateUserDto = {
      email: registerRequest.email,
      password: registerRequest.password,
      fullName: `${registerRequest.firstName} ${registerRequest.lastName}`
    };

    return this.http.post<AuthResponseDto>(
      `${this.apiUrl}/register?residenceId=${environment.residenceId}`,
      createUserDto
    ).pipe(
      tap(response => {
        this.saveTokens(response.accessToken, response.refreshToken);
        const user = {
          id: response.user.id,
          firstName: registerRequest.firstName,
          lastName: registerRequest.lastName,
          email: response.user.email,
          fullName: `${registerRequest.firstName} ${registerRequest.lastName}`,
          phoneNumber: registerRequest.phone,
          role: "Resident",
          avatarUrl: response.user.avatarUrl,
          residentId: response.user.residentId,
          resident: response.user.resident
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Refresh the auth token using a refresh token.
   */
  refreshToken(refreshTokenDto: RefreshTokenDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/refresh`, refreshTokenDto).pipe(
      tap(response => {
        this.saveTokens(response.accessToken, response.refreshToken);
        const user = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          fullName: `${response.user.firstName} ${response.user.lastName}`,
          phoneNumber: response.user.phoneNumber,
          role: response.user.role,
          avatarUrl: response.user.avatarUrl,
          residentId: response.user.residentId,
          resident: response.user.resident
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  Logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // --- Token management ---

  private saveTokens(token: string, refreshToken: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // --- User helpers ---

  private getUserFromStorage(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  getCurrentResidentId(): string | null {
    const user = this.getCurrentUser();
    return user?.residentId || null;
  }

  getCurrentResident(): any | null {
    const user = this.getCurrentUser();
    return user?.resident || null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
