import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    RappelDto,
    CreateRappelDto,
    UpdateRappelDto,
    PaginatedRappelsResponse
} from './rappel-model';

@Injectable({
    providedIn: 'root',
})
export class RappelServices {
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    private rappelsSubject = new BehaviorSubject<RappelDto[]>([]);
    rappels$ = this.rappelsSubject.asObservable();

    private paginationSubject = new BehaviorSubject<Omit<PaginatedRappelsResponse, 'items'>>({
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });
    pagination$ = this.paginationSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Load all rappels for the current residence (paginated).
     */
    loadRappels(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedRappelsResponse> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        this.loadingSubject.next(true);
        return this.http.get<PaginatedRappelsResponse>(
            `${this.apiUrl}/${this.residenceId}/rappels`,
            { params }
        ).pipe(
            tap({
                next: (result) => {
                    this.rappelsSubject.next(result.items);
                    this.paginationSubject.next({
                        totalCount: result.totalCount,
                        pageNumber: result.pageNumber,
                        pageSize: result.pageSize,
                        totalPages: result.totalPages,
                        hasNextPage: result.hasNextPage,
                        hasPreviousPage: result.hasPreviousPage,
                    });
                    this.loadingSubject.next(false);
                },
                error: () => this.loadingSubject.next(false),
                complete: () => this.loadingSubject.next(false)
            })
        );
    }

    /**
     * Load rappels by house (paginated).
     */
    loadRappelsByHouse(houseId: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedRappelsResponse> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedRappelsResponse>(
            `${this.apiUrl}/${this.residenceId}/rappels/house/${houseId}`,
            { params }
        ).pipe(
            tap(result => {
                this.rappelsSubject.next(result.items);
                this.paginationSubject.next({
                    totalCount: result.totalCount,
                    pageNumber: result.pageNumber,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages,
                    hasNextPage: result.hasNextPage,
                    hasPreviousPage: result.hasPreviousPage,
                });
            })
        );
    }

    /**
     * Get a single rappel by ID.
     */
    getRappelById(id: string): Observable<RappelDto> {
        return this.http.get<RappelDto>(`${this.apiUrl}/${this.residenceId}/rappels/${id}`);
    }

    /**
     * Create a new rappel.
     */
    createRappel(dto: CreateRappelDto): Observable<RappelDto> {
        return this.http.post<RappelDto>(
            `${this.apiUrl}/${this.residenceId}/rappels`,
            dto
        ).pipe(
            tap(newRappel => {
                const current = this.rappelsSubject.value;
                this.rappelsSubject.next([newRappel, ...current]);
            })
        );
    }

    /**
     * Update a rappel.
     */
    updateRappel(id: string, dto: UpdateRappelDto): Observable<RappelDto> {
        return this.http.put<RappelDto>(
            `${this.apiUrl}/${this.residenceId}/rappels/${id}`,
            dto
        ).pipe(
            tap(updated => {
                const current = this.rappelsSubject.value;
                const index = current.findIndex(r => r.id === id);
                if (index !== -1) {
                    current[index] = updated;
                    this.rappelsSubject.next([...current]);
                }
            })
        );
    }

    /**
     * Delete a rappel.
     */
    deleteRappel(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${this.residenceId}/rappels/${id}`).pipe(
            tap(() => {
                const current = this.rappelsSubject.value;
                this.rappelsSubject.next(current.filter(r => r.id !== id));
            })
        );
    }
}
