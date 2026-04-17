import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DepenseModel,
    CreateExpenseDto,
    UpdateExpenseDto,
    CreateExpenseImageDto,
    ExpenseImageDto,
    PaginatedResponse,
    PaginationDto
} from './depense-model';

@Injectable({
    providedIn: 'root',
})
export class DepenseServices {

    private baseUrl = `${environment.apiUrl}/residences`;

    private loadingSubject = new BehaviorSubject<boolean>(false);
    loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Get all expenses for a residence with pagination.
     */
    getExpensesByResidence(
        residenceId: string,
        pagination?: PaginationDto
    ): Observable<PaginatedResponse<DepenseModel>> {
        let params = new HttpParams();
        if (pagination?.pageNumber) {
            params = params.set('pageNumber', pagination.pageNumber.toString());
        }
        if (pagination?.pageSize) {
            params = params.set('pageSize', pagination.pageSize.toString());
        }
        this.loadingSubject.next(true);
        return this.http.get<PaginatedResponse<DepenseModel>>(
            `${this.baseUrl}/${residenceId}/expenses`,
            { params }
        ).pipe(
            tap({
                next: () => this.loadingSubject.next(false),
                error: () => this.loadingSubject.next(false),
                complete: () => this.loadingSubject.next(false)
            })
        );
    }

    /**
     * Get a single expense by ID.
     */
    getExpenseById(residenceId: string, id: string): Observable<DepenseModel> {
        return this.http.get<DepenseModel>(
            `${this.baseUrl}/${residenceId}/expenses/${id}`
        );
    }

    /**
     * Create a new expense.
     */
    createExpense(residenceId: string, dto: CreateExpenseDto): Observable<DepenseModel> {
        return this.http.post<DepenseModel>(
            `${this.baseUrl}/${residenceId}/expenses`,
            dto
        );
    }

    /**
     * Update an existing expense.
     */
    updateExpense(residenceId: string, id: string, dto: UpdateExpenseDto): Observable<DepenseModel> {
        return this.http.put<DepenseModel>(
            `${this.baseUrl}/${residenceId}/expenses/${id}`,
            dto
        );
    }

    /**
     * Delete an expense.
     */
    deleteExpense(residenceId: string, id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.baseUrl}/${residenceId}/expenses/${id}`
        );
    }

    /**
     * Add an image to an expense.
     */
    addImageToExpense(
        residenceId: string,
        expenseId: string,
        dto: CreateExpenseImageDto
    ): Observable<ExpenseImageDto> {
        return this.http.post<ExpenseImageDto>(
            `${this.baseUrl}/${residenceId}/expenses/${expenseId}/images`,
            dto
        );
    }

    /**
     * Remove an image from an expense.
     */
    removeImageFromExpense(residenceId: string, imageId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.baseUrl}/${residenceId}/expenses/images/${imageId}`
        );
    }
}
