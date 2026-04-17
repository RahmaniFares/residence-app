import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, shareReplay, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
    TarifDto,
    CreateTarifDto,
    UpdateTarifDto,
    UpdateTarifHistoryDto,
    TarifHistoryDto,
    ApiError
} from './tarif-model';

@Injectable({
    providedIn: 'root'
})
export class TarifService {

    private readonly baseUrl = `${environment.apiUrl}/residences`;

    // Loading state
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    // Error state
    private errorSubject = new BehaviorSubject<ApiError | null>(null);
    public error$ = this.errorSubject.asObservable();

    constructor(private http: HttpClient) { }

    // ============================================================
    // CRUD Operations
    // ============================================================

    /**
     * Create a new tariff for a residence.
     */
    createTarif(residenceId: string, dto: CreateTarifDto): Observable<TarifDto> {
        return this.executeRequest(() =>
            this.http.post<TarifDto>(
                `${this.baseUrl}/${residenceId}/tarifs`,
                this.normalizeDates(dto)
            )
        );
    }

    /**
     * Get a tariff by its ID.
     */
    getTarifById(residenceId: string, tarifId: string): Observable<TarifDto> {
        return this.executeRequest(() =>
            this.http.get<TarifDto>(
                `${this.baseUrl}/${residenceId}/tarifs/${tarifId}`
            ).pipe(
                map(tarif => this.normalizeTarifDates(tarif))
            )
        );
    }

    /**
     * Get all tariffs for a residence (active and inactive).
     */
    getTarifsByResidence(residenceId: string): Observable<TarifDto[]> {
        return this.executeRequest(() =>
            this.http.get<TarifDto[]>(
                `${this.baseUrl}/${residenceId}/tarifs`
            ).pipe(
                map(tarifs => tarifs.map(t => this.normalizeTarifDates(t))),
                shareReplay(1)
            )
        );
    }

    /**
     * Get the current active tariff for a residence.
     */
    getCurrentTarif(residenceId: string): Observable<TarifDto> {
        return this.executeRequest(() =>
            this.http.get<TarifDto>(
                `${this.baseUrl}/${residenceId}/tarifs/current/active`
            ).pipe(
                map(tarif => this.normalizeTarifDates(tarif))
            )
        );
    }

    /**
     * Update a tariff. A history entry is automatically created by the backend.
     */
    updateTarif(
        residenceId: string,
        tarifId: string,
        dto: UpdateTarifDto
    ): Observable<TarifDto> {
        return this.executeRequest(() =>
            this.http.put<TarifDto>(
                `${this.baseUrl}/${residenceId}/tarifs/${tarifId}`,
                dto
            ).pipe(
                map(tarif => this.normalizeTarifDates(tarif))
            )
        );
    }

    /**
     * Soft-delete a tariff.
     */
    deleteTarif(residenceId: string, tarifId: string): Observable<void> {
        return this.executeRequest(() =>
            this.http.delete<void>(
                `${this.baseUrl}/${residenceId}/tarifs/${tarifId}`
            )
        );
    }

    // ============================================================
    // History Operations
    // ============================================================

    /**
     * Get the change history for a specific tariff.
     */
    getTarifHistory(residenceId: string, tarifId: string): Observable<TarifHistoryDto[]> {
        return this.executeRequest(() =>
            this.http.get<TarifHistoryDto[]>(
                `${this.baseUrl}/${residenceId}/tarifs/${tarifId}/history`
            ).pipe(
                map(history => history.map(h => this.normalizeHistoryDates(h))),
                shareReplay(1)
            )
        );
    }

    /**
     * Get all tariff changes for a residence.
     */
    getResidenceTarifHistory(residenceId: string): Observable<TarifHistoryDto[]> {
        return this.executeRequest(() =>
            this.http.get<TarifHistoryDto[]>(
                `${this.baseUrl}/${residenceId}/tarifs/history/all`
            ).pipe(
                map(history => history.map(h => this.normalizeHistoryDates(h))),
                shareReplay(1)
            )
        );
    }

    /**
     * Get tariff changes within a specific date range.
     */
    getTarifHistoryByDateRange(
        residenceId: string,
        startDate: Date,
        endDate: Date
    ): Observable<TarifHistoryDto[]> {
        const params = new HttpParams()
            .set('startDate', startDate.toISOString())
            .set('endDate', endDate.toISOString());

        return this.executeRequest(() =>
            this.http.get<TarifHistoryDto[]>(
                `${this.baseUrl}/${residenceId}/tarifs/history/range`,
                { params }
            ).pipe(
                map(history => history.map(h => this.normalizeHistoryDates(h))),
                shareReplay(1)
            )
        );
    }

    /**
     * Update a specific tariff history record (correction).
     * PUT /residences/{residenceId}/tarifs/{tarifId}/history/{historyId}
     */
    updateTarifHistory(
        residenceId: string,
        tarifId: string,
        historyId: string,
        dto: UpdateTarifHistoryDto
    ): Observable<TarifHistoryDto> {
        return this.executeRequest(() =>
            this.http.put<TarifHistoryDto>(
                `${this.baseUrl}/${residenceId}/tarifs/${tarifId}/history/${historyId}`,
                dto
            ).pipe(
                map(history => this.normalizeHistoryDates(history))
            )
        );
    }

    /**
     * Export tariff history as a CSV Blob.
     */
    exportTarifHistoryCsv(residenceId: string): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/${residenceId}/tarifs/history/export`,
            { responseType: 'blob' }
        );
    }

    // ============================================================
    // State Accessors
    // ============================================================

    isLoading(): Observable<boolean> {
        return this.loading$;
    }

    getError(): Observable<ApiError | null> {
        return this.error$;
    }

    clearError(): void {
        this.errorSubject.next(null);
    }

    // ============================================================
    // Private Helpers
    // ============================================================

    /**
     * Wraps an HTTP request with loading and error state management.
     */
    private executeRequest<T>(request: () => Observable<T>): Observable<T> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        return request().pipe(
            tap(() => this.errorSubject.next(null)),
            catchError((error: HttpErrorResponse) => {
                const apiError: ApiError = {
                    message: error.error?.message || 'Une erreur est survenue',
                    statusCode: error.status,
                    details: error.error?.details
                };
                this.errorSubject.next(apiError);
                return throwError(() => apiError);
            }),
            finalize(() => this.loadingSubject.next(false))
        );
    }

    /** Converts effectiveDate to ISO string before sending to backend. */
    private normalizeDates(dto: CreateTarifDto): CreateTarifDto {
        return {
            ...dto,
            effectiveDate: typeof dto.effectiveDate === 'string'
                ? new Date(dto.effectiveDate).toISOString()
                : (dto.effectiveDate as Date).toISOString()
        };
    }

    /** Converts date strings from the backend into Date objects. */
    private normalizeTarifDates(tarif: TarifDto): TarifDto {
        return {
            ...tarif,
            effectiveDate: new Date(tarif.effectiveDate),
            endDate: tarif.endDate ? new Date(tarif.endDate) : null,
            createdAt: new Date(tarif.createdAt),
            updatedAt: tarif.updatedAt ? new Date(tarif.updatedAt) : null
        };
    }

    /** Converts date strings in history entries into Date objects. */
    private normalizeHistoryDates(history: TarifHistoryDto): TarifHistoryDto {
        return {
            ...history,
            effectiveDate: new Date(history.effectiveDate),
            changedAt: new Date(history.changedAt)
        };
    }
}
