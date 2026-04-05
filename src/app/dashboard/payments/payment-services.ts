import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    PaymentModel,
    PaymentDto,
    CreatePaymentDto,
    UpdatePaymentDto,
    PaginatedResult
} from './payment-model';

@Injectable({
    providedIn: 'root',
})
export class PaymentServices {
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    private paymentsSubject = new BehaviorSubject<PaymentModel[]>([]);
    payments$ = this.paymentsSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Load all payments for the current residence (paginated).
     */
    loadPayments(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<PaymentDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedResult<PaymentDto>>(
            `${this.apiUrl}/${this.residenceId}/payments`,
            { params }
        ).pipe(
            tap(result => {
                const mapped = result.items.map(p => this.mapDtoToModel(p));
                this.paymentsSubject.next(mapped);
            })
        );
    }

    /**
     * Load payments by resident (paginated).
     */
    loadPaymentsByResident(residentId: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<PaymentDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedResult<PaymentDto>>(
            `${this.apiUrl}/${this.residenceId}/payments/resident/${residentId}`,
            { params }
        ).pipe(
            tap(result => {
                const mapped = result.items.map(p => this.mapDtoToModel(p));
                this.paymentsSubject.next(mapped);
            })
        );
    }

    /**
     * Load payments by house (paginated).
     */
    loadPaymentsByHouse(houseId: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<PaymentDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedResult<PaymentDto>>(
            `${this.apiUrl}/${this.residenceId}/payments/house/${houseId}`,
            { params }
        ).pipe(
            tap(result => {
                const mapped = result.items.map(p => this.mapDtoToModel(p));
                this.paymentsSubject.next(mapped);
            })
        );
    }

    /**
     * Get a single payment by ID.
     */
    getPaymentById(id: string): Observable<PaymentDto> {
        return this.http.get<PaymentDto>(`${this.apiUrl}/${this.residenceId}/payments/${id}`);
    }

    /**
     * Create a new payment.
     */
    addPayment(payment: CreatePaymentDto): Observable<PaymentDto> {
        return this.http.post<PaymentDto>(
            `${this.apiUrl}/${this.residenceId}/payments`,
            payment
        ).pipe(
            tap(newPayment => {
                const current = this.paymentsSubject.value;
                this.paymentsSubject.next([...current, this.mapDtoToModel(newPayment)]);
            })
        );
    }

    /**
     * Update an existing payment.
     */
    updatePayment(id: string, payment: UpdatePaymentDto): Observable<PaymentDto> {
        return this.http.put<PaymentDto>(
            `${this.apiUrl}/${this.residenceId}/payments/${id}`,
            payment
        ).pipe(
            tap(updated => {
                const current = this.paymentsSubject.value;
                const index = current.findIndex(p => p.id === id);
                if (index !== -1) {
                    current[index] = this.mapDtoToModel(updated);
                    this.paymentsSubject.next([...current]);
                }
            })
        );
    }

    /**
     * Delete a payment.
     */
    deletePayment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${this.residenceId}/payments/${id}`).pipe(
            tap(() => {
                const current = this.paymentsSubject.value;
                this.paymentsSubject.next(current.filter(p => p.id !== id));
            })
        );
    }

    /**
     * Mock helper for budget overview stats (unless backend endpoint exists).
     */
    getBudgetOverview() {
        return {
            totalBudget: 45250.00,
            collectedAmount: 12840.00,
            outstandingAmount: 3150.00,
            budgetChangePercentage: 12
        };
    }

    /**
     * Helper to map backend PaymentDto to the application's PaymentModel.
     */
    private mapDtoToModel(dto: PaymentDto): PaymentModel {
        return {
            id: dto.id,
            houseId: dto.houseId,
            residentId: dto.residentId,
            amount: dto.amount,
            paymentDate: dto.paymentDate ? dto.paymentDate.split('T')[0] : undefined,
            periodStart: dto.periodStart.split('T')[0],
            periodEnd: dto.periodEnd.split('T')[0],
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
            status: dto.status
        };
    }
}
