import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UserHouse,
  UserHouseResponse,
  CreateUserHouseRequest,
  UpdateUserHouseRequest,
  PaginatedUserHousesResponse,
  UserHouseDetails,
  AssignmentCheckResponse
} from './user-house-model';

/**
 * UserHouseServices
 *
 * Manages user-house relationships including:
 * - Assigning users to houses
 * - Retrieving user's houses
 * - Retrieving house's users
 * - Updating user-house relationships
 * - Removing assignments
 * - Checking assignments
 */
@Injectable({
  providedIn: 'root'
})
export class UserHouseServices {
  // API base URL constructed with residenceId
  private baseApiUrl = `${environment.apiUrl}/residences`;

  // Observable subjects for state management
  private userHousesSubject = new BehaviorSubject<UserHouse[]>([]);
  public userHouses$ = this.userHousesSubject.asObservable();

  private paginationSubject = new BehaviorSubject<{ totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean }>({
    totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false
  });
  public pagination$ = this.paginationSubject.asObservable();

  private houseUsersSubject = new BehaviorSubject<UserHouse[]>([]);
  public houseUsers$ = this.houseUsersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Assign a user to a house
   */
  assignUserToHouse(residenceId: string, request: CreateUserHouseRequest): Observable<UserHouse> {
    this.setLoading(true);

    return this.http.post<UserHouseResponse>(
      `${this.baseApiUrl}/${residenceId}/user-houses`,
      request
    ).pipe(
      map(response => new UserHouse(response)),
      tap(() => {
        this.errorSubject.next(null);
      }),
      catchError(error => this.handleError(error)),
      tap({
        finalize: () => this.setLoading(false)
      })
    );
  }

  /**
   * Get all houses assigned to a specific user
   */
  getUserHouses(residenceId: string, userId: string): Observable<PaginatedUserHousesResponse<UserHouse>> {
    this.loadingSubject.next(true);
    return this.http.get<PaginatedUserHousesResponse<UserHouseResponse>>(
      `${this.baseApiUrl}/${residenceId}/user-houses/users/${userId}`
    ).pipe(
      map(response => {
        // The backend might return the list in a property named 'houses' or 'items'
        const rawItems = (response as any).houses || response.items || [];
        return {
          ...response,
          items: Array.isArray(rawItems) ? rawItems.map((item: any) => new UserHouse(item)) : []
        } as PaginatedUserHousesResponse<UserHouse>;
      }),
      tap(result => {
        this.userHousesSubject.next(result.items);
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get all users assigned to a specific house
   */
  getHouseUsers(residenceId: string, houseId: string): Observable<PaginatedUserHousesResponse<UserHouse>> {
    this.loadingSubject.next(true);
    return this.http.get<PaginatedUserHousesResponse<UserHouseResponse>>(
      `${this.baseApiUrl}/${residenceId}/user-houses/house/${houseId}`
    ).pipe(
      map(response => {
        // The backend might return the list in a property named 'users' or 'items'
        const rawItems = (response as any).users || response.items || [];
        return {
          ...response,
          items: Array.isArray(rawItems) ? rawItems.map((item: any) => new UserHouse(item)) : []
        } as PaginatedUserHousesResponse<UserHouse>;
      }),
      tap(result => {
        this.houseUsersSubject.next(result.items);
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        this.handleError(err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Update user-house relationship (notes)
   */
  updateUserHouse(
    residenceId: string,
    userId: string,
    houseId: string,
    request: UpdateUserHouseRequest
  ): Observable<UserHouse> {
    this.setLoading(true);

    return this.http.put<UserHouseResponse>(
      `${this.baseApiUrl}/${residenceId}/user-houses/users/${userId}/houses/${houseId}`,
      request
    ).pipe(
      map(response => new UserHouse(response)),
      tap(() => {
        this.errorSubject.next(null);
      }),
      catchError(error => this.handleError(error)),
      tap({
        finalize: () => this.setLoading(false)
      })
    );
  }

  /**
   * Remove user from house
   */
  removeUserFromHouse(residenceId: string, userId: string, houseId: string): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(
      `${this.baseApiUrl}/${residenceId}/user-houses/users/${userId}/houses/${houseId}`
    ).pipe(
      tap(() => {
        let userHouses = this.userHousesSubject.value;
        userHouses = userHouses.filter(uh => !(uh.userId === userId && uh.houseId === houseId));
        this.userHousesSubject.next(userHouses);
        this.errorSubject.next(null);
      }),
      catchError(error => this.handleError(error)),
      tap({
        finalize: () => this.setLoading(false)
      })
    );
  }

  /**
   * Check if user is assigned to house
   */
  isUserAssignedToHouse(residenceId: string, userId: string, houseId: string): Observable<boolean> {
    this.setLoading(true);

    return this.http.get<AssignmentCheckResponse>(
      `${this.baseApiUrl}/${residenceId}/user-houses/users/${userId}/houses/${houseId}/check`
    ).pipe(
      map(response => response.isAssigned),
      catchError(error => {
        this.handleError(error);
        return throwError(() => error);
      }),
      tap({
        finalize: () => this.setLoading(false)
      })
    );
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 400 && error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'Assignation non trouvée';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur';
      } else {
        errorMessage = `Erreur: ${error.status} ${error.statusText}`;
      }
    }

    console.error('UserHouseServices error:', errorMessage, error);
    this.errorSubject.next(errorMessage);
    return throwError(() => error);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
