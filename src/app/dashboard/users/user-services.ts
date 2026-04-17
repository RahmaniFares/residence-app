import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UserModel,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  PaginationParams,
  PaginatedResponse
} from './user-model';

@Injectable({
  providedIn: 'root'
})
export class UserServices {
  private readonly apiUrl = `${environment.apiUrl}/residences/users`;
  private residenceId = environment.residenceId;

  private currentUserSubject = new BehaviorSubject<UserModel | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private usersSubject = new BehaviorSubject<UserModel[]>([]);
  public users$ = this.usersSubject.asObservable();

  private paginationSubject = new BehaviorSubject<Omit<PaginatedResponse<any>, 'items'>>({
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  public pagination$ = this.paginationSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  private initializeService(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData: UserResponse = JSON.parse(savedUser);
        this.currentUserSubject.next(new UserModel(userData));
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  loadUsers(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResponse<UserModel>> {
    this.setLoading(true);
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<UserResponse>>(
      `${this.apiUrl}/residence/${this.residenceId}`,
      { params }
    ).pipe(
      map(response => ({
        ...response,
        items: response.items.map(item => new UserModel(item))
      })),
      tap(result => {
        this.usersSubject.next(result.items);
        this.paginationSubject.next({
          totalCount: result.totalCount,
          pageNumber: result.pageNumber,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasPreviousPage: result.hasPreviousPage,
          hasNextPage: result.hasNextPage,
        });
        this.errorSubject.next(null);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      tap({ finalize: () => this.setLoading(false) })
    );
  }

  createUser(request: CreateUserRequest): Observable<UserModel> {
    this.setLoading(true);
    const params = new HttpParams().set('residenceId', this.residenceId);
    return this.http.post<UserResponse>(this.apiUrl, request, { params }).pipe(
      map(response => new UserModel(response)),
      tap(user => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, user]);
        this.errorSubject.next(null);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      tap({ finalize: () => this.setLoading(false) })
    );
  }

  getUserById(userId: string): Observable<UserModel> {
    this.setLoading(true);
    return this.http.get<UserResponse>(`${this.apiUrl}/${userId}`).pipe(
      map(response => new UserModel(response)),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      tap({ finalize: () => this.setLoading(false) })
    );
  }

  updateUser(userId: string, request: UpdateUserRequest): Observable<UserModel> {
    this.setLoading(true);
    return this.http.put<UserResponse>(`${this.apiUrl}/${userId}`, request).pipe(
      map(response => new UserModel(response)),
      tap(user => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          currentUsers[index] = user;
          this.usersSubject.next([...currentUsers]);
        }
        if (this.currentUserSubject.value?.id === user.id) {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.errorSubject.next(null);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      tap({ finalize: () => this.setLoading(false) })
    );
  }

  deleteUser(userId: string): Observable<void> {
    this.setLoading(true);
    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      tap(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next(currentUsers.filter(u => u.id !== userId));
        this.errorSubject.next(null);
      }),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      tap({ finalize: () => this.setLoading(false) })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 400 && error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur';
      } else {
        errorMessage = `Erreur: ${error.status}`;
      }
    }
    this.errorSubject.next(errorMessage);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
