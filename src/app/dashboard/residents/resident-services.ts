import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResidentModel } from './resident-model';

// --- DTOs matching backend API ---

export interface CreateResidentDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  houseId?: string;
  birthDate?: string;
}

export interface UpdateResidentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  houseId?: string;
  birthDate?: string;
}

export interface ResidentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  houseId?: string;
  birthDate?: string;
  residenceId: string;
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
  providedIn: 'root',
})
export class ResidentServices {
  private apiUrl = `${environment.apiUrl}/residences`;
  private residenceId = environment.residenceId;

  private residentsSubject = new BehaviorSubject<ResidentModel[]>([]);
  residents$ = this.residentsSubject.asObservable();

  private paginationSubject = new BehaviorSubject<Omit<PaginatedResult<any>, 'items'>>({
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  pagination$ = this.paginationSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Fetch all residents from the backend with pagination.
   * Updates the internal BehaviorSubject so existing template subscriptions keep working.
   */
  loadResidents(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<ResidentDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    this.loadingSubject.next(true);
    return this.http.get<PaginatedResult<ResidentDto>>(
      `${this.apiUrl}/${this.residenceId}/residents`,
      { params }
    ).pipe(
      tap({
        next: (result) => {
          // Map backend DTOs to local ResidentModel for backward compatibility
          const mapped: ResidentModel[] = result.items.map(r => this.mapDtoToModel(r));
          this.residentsSubject.next(mapped);
          this.paginationSubject.next({
            totalCount: result.totalCount,
            pageNumber: result.pageNumber,
            pageSize: result.pageSize,
            totalPages: result.totalPages,
            hasPreviousPage: result.hasPreviousPage,
            hasNextPage: result.hasNextPage,
          });
          this.loadingSubject.next(false);
        },
        error: () => this.loadingSubject.next(false),
        complete: () => this.loadingSubject.next(false)
      })
    );
  }

  /**
   * Fetch residents by house ID with pagination.
   */
  loadResidentsByHouse(houseId: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<ResidentDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResult<ResidentDto>>(
      `${this.apiUrl}/${this.residenceId}/residents/house/${houseId}`,
      { params }
    ).pipe(
      tap(result => {
        const mapped: ResidentModel[] = result.items.map(r => this.mapDtoToModel(r));
        this.residentsSubject.next(mapped);
        this.paginationSubject.next({
          totalCount: result.totalCount,
          pageNumber: result.pageNumber,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasPreviousPage: result.hasPreviousPage,
          hasNextPage: result.hasNextPage,
        });
      })
    );
  }

  /**
   * Create a new resident via backend API.
   */
  addResident(resident: Omit<ResidentModel, 'id' | 'createdAt' | 'status' | 'block'>): Observable<ResidentDto> {
    const createDto: CreateResidentDto = {
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email,
      phoneNumber: resident.phone,
      birthDate: resident.birthDate,
    };

    return this.http.post<ResidentDto>(
      `${this.apiUrl}/${this.residenceId}/residents`,
      createDto
    ).pipe(
      tap(newResident => {
        // Add to local state for immediate UI update
        const currentResidents = this.residentsSubject.value;
        this.residentsSubject.next([...currentResidents, this.mapDtoToModel(newResident)]);
      })
    );
  }

  /**
   * Get a single resident by ID from the backend (async).
   */
  getResidentByIdFromApi(id: string): Observable<ResidentDto> {
    return this.http.get<ResidentDto>(
      `${this.apiUrl}/${this.residenceId}/residents/${id}`
    );
  }

  /**
   * Get a resident by ID from local cache (synchronous).
   * Backward-compatible method used by components that need synchronous lookups.
   */
  getResidentById(id: string): ResidentModel | undefined {
    return this.residentsSubject.value.find(r => r.id === id);
  }

  /**
   * Update a resident via backend API.
   */
  updateResident(updatedResident: ResidentModel): Observable<ResidentDto> {
    const updateDto: UpdateResidentDto = {
      firstName: updatedResident.firstName,
      lastName: updatedResident.lastName,
      email: updatedResident.email,
      phoneNumber: updatedResident.phone,
      birthDate: updatedResident.birthDate,
    };

    return this.http.put<ResidentDto>(
      `${this.apiUrl}/${this.residenceId}/residents/${updatedResident.id}`,
      updateDto
    ).pipe(
      tap(updated => {
        // Update local state
        const currentResidents = this.residentsSubject.value;
        const index = currentResidents.findIndex(r => r.id === updatedResident.id);
        if (index !== -1) {
          currentResidents[index] = this.mapDtoToModel(updated);
          this.residentsSubject.next([...currentResidents]);
        }
      })
    );
  }

  /**
   * Delete a resident via backend API.
   */
  deleteResident(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${this.residenceId}/residents/${id}`
    ).pipe(
      tap(() => {
        // Remove from local state
        const currentResidents = this.residentsSubject.value;
        this.residentsSubject.next(currentResidents.filter(r => r.id !== id));
      })
    );
  }

  /**
   * Map a backend ResidentDto to the local ResidentModel.
   */
  private mapDtoToModel(dto: ResidentDto): ResidentModel {
    return {
      id: dto.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      birthDate: dto.birthDate,
      phone: dto.phoneNumber || '',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };
  }
}
