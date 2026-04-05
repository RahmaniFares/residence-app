# Residence API - Angular Integration Guide

This document provides comprehensive documentation for integrating your Angular application with the Residence API endpoints. It includes all available endpoints, request/response DTOs, and example Angular service implementations.

## Table of Contents

1. [API Base Configuration](#api-base-configuration)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Residents Endpoints](#residents-endpoints)
4. [Posts & Community Endpoints](#posts--community-endpoints)
5. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
6. [Example Angular Services](#example-angular-services)
7. [Error Handling](#error-handling)

---

## API Base Configuration

**Base URL**: `http://localhost:5000/api` (or your deployed API URL)

**CORS Policy**: All origins allowed (`*`)

**Authentication**: Bearer token-based JWT authentication

### Setup in Angular (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

---

## Authentication Endpoints

### 1. User Login
**Endpoint**: `POST /api/auth/login`

**Request**:
```typescript
interface LoginDto {
  email: string;
  password: string;
}
```

**Response** (200 OK):
```typescript
interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 2. User Registration
**Endpoint**: `POST /api/auth/register`

**Query Parameters**:
- `residenceId` (string, Guid): The residence ID to register the user for

**Request**:
```typescript
interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  // Add other user fields as needed
}
```

**Response** (201 Created):
```typescript
interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 3. Refresh Token
**Endpoint**: `POST /api/auth/refresh`

**Request**:
```typescript
interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}
```

**Response** (200 OK):
```typescript
interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

---

## Residents Endpoints

**Base URL**: `/api/residences/{residenceId}/residents`

### 1. Create Resident
**Endpoint**: `POST /api/residences/{residenceId}/residents/`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID

**Request**:
```typescript
interface CreateResidentDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  // Add other resident fields as needed
}
```

**Response** (201 Created):
```typescript
interface ResidentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  residenceId: string;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 2. Get Resident by ID
**Endpoint**: `GET /api/residences/{residenceId}/residents/{id}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `id` (string, Guid): The resident ID

**Response** (200 OK):
```typescript
interface ResidentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  residenceId: string;
}
```

**Error Response** (404 Not Found):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 3. Update Resident
**Endpoint**: `PUT /api/residences/{residenceId}/residents/{id}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `id` (string, Guid): The resident ID

**Request**:
```typescript
interface UpdateResidentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  // Add other updatable resident fields
}
```

**Response** (200 OK):
```typescript
interface ResidentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  residenceId: string;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 4. Delete Resident
**Endpoint**: `DELETE /api/residences/{residenceId}/residents/{id}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `id` (string, Guid): The resident ID

**Response** (204 No Content): No body

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 5. Get All Residents in Residence
**Endpoint**: `GET /api/residences/{residenceId}/residents/`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID

**Query Parameters**:
- `pageNumber` (number, optional): Page number for pagination (default: 1)
- `pageSize` (number, optional): Page size for pagination (default: 10)

**Response** (200 OK):
```typescript
interface PaginatedResult<ResidentDto> {
  items: ResidentDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 6. Get Residents in a Specific House
**Endpoint**: `GET /api/residences/{residenceId}/residents/house/{houseId}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `houseId` (string, Guid): The house ID

**Query Parameters**:
- `pageNumber` (number, optional): Page number for pagination
- `pageSize` (number, optional): Page size for pagination

**Response** (200 OK):
```typescript
interface PaginatedResult<ResidentDto> {
  items: ResidentDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

---

## Posts & Community Endpoints

**Base URL**: `/api/residences/{residenceId}/posts`

### 1. Create Post
**Endpoint**: `POST /api/residences/{residenceId}/posts/`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID

**Query Parameters**:
- `authorId` (string, Guid): The ID of the user creating the post

**Request**:
```typescript
interface CreatePostDto {
  title: string;
  content: string;
  category?: string;
  // Add other post fields as needed
}
```

**Response** (201 Created):
```typescript
interface PostDto {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  residenceId: string;
  createdAt: string; // ISO DateTime
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 2. Get Post by ID
**Endpoint**: `GET /api/residences/{residenceId}/posts/{id}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `id` (string, Guid): The post ID

**Query Parameters**:
- `currentUserId` (string, Guid, optional): The current user ID (for like status)

**Response** (200 OK):
```typescript
interface PostDto {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  residenceId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}
```

**Error Response** (404 Not Found):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 3. Update Post
**Endpoint**: `PUT /api/residences/{residenceId}/posts/{id}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `id` (string, Guid): The post ID

**Request**:
```typescript
interface UpdatePostDto {
  title?: string;
  content?: string;
  category?: string;
  // Add other updatable fields
}
```

**Response** (200 OK):
```typescript
interface PostDto {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  residenceId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 4. Delete Post
**Endpoint**: `DELETE /api/residences/{residenceId}/posts/{id}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `id` (string, Guid): The post ID

**Response** (204 No Content): No body

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 5. Get All Posts in Residence
**Endpoint**: `GET /api/residences/{residenceId}/posts/`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID

**Query Parameters**:
- `currentUserId` (string, Guid, optional): The current user ID (for like status)
- `pageNumber` (number, optional): Page number for pagination
- `pageSize` (number, optional): Page size for pagination

**Response** (200 OK):
```typescript
interface PaginatedResult<PostDto> {
  items: PostDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 6. Like Post
**Endpoint**: `POST /api/residences/{residenceId}/posts/{postId}/likes`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `postId` (string, Guid): The post ID

**Query Parameters**:
- `userId` (string, Guid): The ID of the user liking the post

**Response** (200 OK):
```typescript
interface PostDto {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  residenceId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 7. Remove Like
**Endpoint**: `DELETE /api/residences/{residenceId}/posts/{postId}/likes/{userId}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `postId` (string, Guid): The post ID
- `userId` (string, Guid): The ID of the user removing the like

**Response** (204 No Content): No body

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 8. Add Comment to Post
**Endpoint**: `POST /api/residences/{residenceId}/posts/{postId}/comments`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `postId` (string, Guid): The post ID

**Query Parameters**:
- `authorId` (string, Guid): The ID of the user creating the comment

**Request**:
```typescript
interface CreatePostCommentDto {
  content: string;
}
```

**Response** (201 Created):
```typescript
interface PostCommentDto {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 9. Remove Comment
**Endpoint**: `DELETE /api/residences/{residenceId}/posts/comments/{commentId}`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `commentId` (string, Guid): The comment ID

**Response** (204 No Content): No body

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

### 10. Get Post Comments
**Endpoint**: `GET /api/residences/{residenceId}/posts/{postId}/comments`

**Path Parameters**:
- `residenceId` (string, Guid): The residence ID
- `postId` (string, Guid): The post ID

**Response** (200 OK):
```typescript
interface PostCommentDto[] {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Error Response** (400 Bad Request):
```typescript
interface ErrorResponse {
  message: string;
}
```

---

## DTOs (Data Transfer Objects)

### Authentication DTOs

```typescript
// Request
interface LoginDto {
  email: string;
  password: string;
}

interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
}

interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

// Response
interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: UserDto;
}

interface UserDto {
  id: string;
  email: string;
  fullName: string;
}
```

### Resident DTOs

```typescript
interface CreateResidentDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
}

interface UpdateResidentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  apartmentNumber?: string;
}

interface ResidentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  residenceId: string;
}
```

### Post DTOs

```typescript
interface CreatePostDto {
  title: string;
  content: string;
  category?: string;
}

interface UpdatePostDto {
  title?: string;
  content?: string;
  category?: string;
}

interface PostDto {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  residenceId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}

interface CreatePostCommentDto {
  content: string;
}

interface PostCommentDto {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Pagination DTO

```typescript
interface PaginationDto {
  pageNumber?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

---

## Example Angular Services

### 1. Authentication Service

Create a file: `src/app/services/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());

  constructor(private http: HttpClient) {}

  login(loginDto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, loginDto)
      .pipe(
        tap(response => {
          this.saveTokens(response.token, response.refreshToken);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  register(createUserDto: CreateUserDto, residenceId: string): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(
      `${this.apiUrl}/register?residenceId=${residenceId}`,
      createUserDto
    ).pipe(
      tap(response => {
        this.saveTokens(response.token, response.refreshToken);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  refreshToken(refreshTokenDto: RefreshTokenDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/refresh`, refreshTokenDto)
      .pipe(
        tap(response => {
          this.saveTokens(response.token, response.refreshToken);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

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

  private getUserFromStorage(): any {
    // Decode JWT or retrieve from localStorage
    return null;
  }

  get currentUser$() {
    return this.currentUserSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
```

### 2. Resident Service

Create a file: `src/app/services/resident.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ResidentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
  residenceId: string;
}

export interface CreateResidentDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  apartmentNumber?: string;
}

export interface UpdateResidentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  apartmentNumber?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ResidentService {
  private apiUrl = `${environment.apiUrl}/residences`;

  constructor(private http: HttpClient) {}

  createResident(residenceId: string, createResidentDto: CreateResidentDto): Observable<ResidentDto> {
    return this.http.post<ResidentDto>(
      `${this.apiUrl}/${residenceId}/residents`,
      createResidentDto
    );
  }

  getResident(residenceId: string, id: string): Observable<ResidentDto> {
    return this.http.get<ResidentDto>(
      `${this.apiUrl}/${residenceId}/residents/${id}`
    );
  }

  updateResident(residenceId: string, id: string, updateResidentDto: UpdateResidentDto): Observable<ResidentDto> {
    return this.http.put<ResidentDto>(
      `${this.apiUrl}/${residenceId}/residents/${id}`,
      updateResidentDto
    );
  }

  deleteResident(residenceId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${residenceId}/residents/${id}`
    );
  }

  getResidentsByResidence(residenceId: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<ResidentDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<ResidentDto>>(
      `${this.apiUrl}/${residenceId}/residents`,
      { params }
    );
  }

  getResidentsByHouse(residenceId: string, houseId: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<ResidentDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<ResidentDto>>(
      `${this.apiUrl}/${residenceId}/residents/house/${houseId}`,
      { params }
    );
  }
}
```

### 3. Post Service

Create a file: `src/app/services/post.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PostDto {
  id: string;
  title: string;
  content: string;
  category?: string;
  authorId: string;
  authorName: string;
  residenceId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}

export interface CreatePostDto {
  title: string;
  content: string;
  category?: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  category?: string;
}

export interface PostCommentDto {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostCommentDto {
  content: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = `${environment.apiUrl}/residences`;

  constructor(private http: HttpClient) {}

  createPost(residenceId: string, authorId: string, createPostDto: CreatePostDto): Observable<PostDto> {
    let params = new HttpParams().set('authorId', authorId);

    return this.http.post<PostDto>(
      `${this.apiUrl}/${residenceId}/posts`,
      createPostDto,
      { params }
    );
  }

  getPost(residenceId: string, id: string, currentUserId?: string): Observable<PostDto> {
    let params = new HttpParams();
    if (currentUserId) {
      params = params.set('currentUserId', currentUserId);
    }

    return this.http.get<PostDto>(
      `${this.apiUrl}/${residenceId}/posts/${id}`,
      { params }
    );
  }

  updatePost(residenceId: string, id: string, updatePostDto: UpdatePostDto): Observable<PostDto> {
    return this.http.put<PostDto>(
      `${this.apiUrl}/${residenceId}/posts/${id}`,
      updatePostDto
    );
  }

  deletePost(residenceId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${residenceId}/posts/${id}`
    );
  }

  getPostsByResidence(residenceId: string, currentUserId?: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<PostDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (currentUserId) {
      params = params.set('currentUserId', currentUserId);
    }

    return this.http.get<PaginatedResult<PostDto>>(
      `${this.apiUrl}/${residenceId}/posts`,
      { params }
    );
  }

  likePost(residenceId: string, postId: string, userId: string): Observable<PostDto> {
    let params = new HttpParams().set('userId', userId);

    return this.http.post<PostDto>(
      `${this.apiUrl}/${residenceId}/posts/${postId}/likes`,
      {},
      { params }
    );
  }

  removeLike(residenceId: string, postId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${residenceId}/posts/${postId}/likes/${userId}`
    );
  }

  addComment(residenceId: string, postId: string, authorId: string, createCommentDto: CreatePostCommentDto): Observable<PostCommentDto> {
    let params = new HttpParams().set('authorId', authorId);

    return this.http.post<PostCommentDto>(
      `${this.apiUrl}/${residenceId}/posts/${postId}/comments`,
      createCommentDto,
      { params }
    );
  }

  removeComment(residenceId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${residenceId}/posts/comments/${commentId}`
    );
  }

  getPostComments(residenceId: string, postId: string): Observable<PostCommentDto[]> {
    return this.http.get<PostCommentDto[]>(
      `${this.apiUrl}/${residenceId}/posts/${postId}/comments`
    );
  }
}
```

### 4. HTTP Interceptor (for JWT Authentication)

Create a file: `src/app/interceptors/auth.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Try to refresh token
          const refreshToken = this.authService.getRefreshToken();
          if (refreshToken) {
            return this.authService.refreshToken({
              token: token!,
              refreshToken: refreshToken
            }).pipe(
              switchMap(() => {
                // Retry the original request with new token
                const newToken = this.authService.getToken();
                if (newToken) {
                  request = request.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`
                    }
                  });
                }
                return next.handle(request);
              }),
              catchError(() => {
                this.authService.logout();
                return throwError(() => error);
              })
            );
          } else {
            this.authService.logout();
            return throwError(() => error);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
```

Register in `src/app/app.module.ts`:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  // ... other configs
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class AppModule { }
```

---

## Error Handling

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request succeeded but no content to return |
| 400 | Bad Request - Invalid request parameters or data |
| 401 | Unauthorized - Missing or invalid authentication token |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server-side error |

### Error Response Format

All error responses follow this format:

```typescript
interface ErrorResponse {
  message: string;
}
```

### Error Handling Example in Components

```typescript
import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService) {}

  login(email: string, password: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        // Navigate to dashboard
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed';
        console.error('Login error:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
```

---

## Usage Tips

1. **Always handle errors** - Use `.subscribe()` with error callbacks or use async pipe with proper error handling in templates
2. **Manage pagination** - Default page size is usually 10, adjust as needed
3. **Store user context** - Keep track of `currentUserId` and `residenceId` for most operations
4. **Token management** - The interceptor handles token refresh automatically on 401 errors
5. **Type safety** - Use the provided interfaces for better TypeScript support

---

## Additional Resources

- API Base URL: `http://localhost:5000/api`
- CORS: Enabled for all origins
- Authentication: Bearer token (JWT)
- Documentation: Check Swagger UI at `http://localhost:5000/swagger/index.html`

