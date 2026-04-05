import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
        return this.http.get<PaginatedResponse<DepenseModel>>(
            `${this.baseUrl}/${residenceId}/expenses`,
            { params }
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
