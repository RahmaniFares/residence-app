import { Injectable } from '@angular/core';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  apartment?: string;
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
  // Mock users storage
  private users: RegisterRequest[] = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin',
      apartment: '100',
      password: 'admin'
    }
  ];

  Login(loginrequest: LoginRequest): boolean {
    const user = this.users.find(u =>
      (u.email === loginrequest.emailOrApartment || u.apartment === loginrequest.emailOrApartment) &&
      u.password === loginrequest.password
    );

    if (user) {
      console.log("Login successful for:", user.firstName, user.lastName);
      // Store user info in localStorage for session
      localStorage.setItem('currentUser', JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        apartment: user.apartment
      }));
      return true;
    }

    console.log("Login failed: Invalid credentials");
    return false;
  }

  Register(registerRequest: RegisterRequest): boolean {
    // Check if email already exists
    const existingUser = this.users.find(u => u.email === registerRequest.email);
    if (existingUser) {
      console.log("Registration failed: Email already exists");
      return false;
    }

    // Add new user
    this.users.push(registerRequest);
    console.log("Registration successful for:", registerRequest.firstName, registerRequest.lastName);
    return true;
  }

  Logout(): void {
    localStorage.removeItem('currentUser');
    console.log("User logged out");
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }
}
