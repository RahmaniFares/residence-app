import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DonationDto,
    DonationDetailDto,
    CreateDonationDto,
    UpdateDonationDto,
    DonationSummary
} from './donation-model';

@Injectable({
    providedIn: 'root'
})
export class DonationService {
    private apiUrl = `${environment.apiUrl}/donations`;

    private donationsSubject = new BehaviorSubject<DonationDto[]>([]);
    public donations$ = this.donationsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    /** Get all donations */
    getAllDonations(): Observable<DonationDto[]> {
        this.loadingSubject.next(true);
        return this.http.get<DonationDto[]>(`${this.apiUrl}/`).pipe(
            tap({
                next: (data) => {
                    this.donationsSubject.next(data);
                    this.loadingSubject.next(false);
                },
                error: () => this.loadingSubject.next(false)
            })
        );
    }

    /** Get donation by ID */
    getDonationById(id: string): Observable<DonationDto> {
        return this.http.get<DonationDto>(`${this.apiUrl}/${id}`);
    }

    /** Get donation details with house & donor */
    getDonationDetails(id: string): Observable<DonationDetailDto> {
        return this.http.get<DonationDetailDto>(`${this.apiUrl}/${id}/details`);
    }

    /** Get donations by house */
    getDonationsByHouse(houseId: string): Observable<DonationDto[]> {
        return this.http.get<DonationDto[]>(`${this.apiUrl}/house/${houseId}`);
    }

    /** Get donations by donor */
    getDonationsByDonor(donorId: string): Observable<DonationDto[]> {
        return this.http.get<DonationDto[]>(`${this.apiUrl}/donor/${donorId}`);
    }

    /** Get donations by date range */
    getDonationsByDateRange(startDate: string, endDate: string): Observable<DonationDto[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<DonationDto[]>(`${this.apiUrl}/by-date-range`, { params });
    }

    /** Create donation */
    createDonation(donation: CreateDonationDto): Observable<DonationDto> {
        return this.http.post<DonationDto>(`${this.apiUrl}/`, donation).pipe(
            tap(created => {
                const current = this.donationsSubject.value;
                this.donationsSubject.next([created, ...current]);
            })
        );
    }

    /** Update donation */
    updateDonation(id: string, donation: UpdateDonationDto): Observable<DonationDto> {
        return this.http.put<DonationDto>(`${this.apiUrl}/${id}`, donation).pipe(
            tap(updated => {
                const current = this.donationsSubject.value;
                const idx = current.findIndex(d => d.id === id);
                if (idx !== -1) {
                    current[idx] = updated;
                    this.donationsSubject.next([...current]);
                }
            })
        );
    }

    /** Delete donation */
    deleteDonation(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const current = this.donationsSubject.value;
                this.donationsSubject.next(current.filter(d => d.id !== id));
            })
        );
    }

    /** Calculate local statistics */
    calculateStats(donations: DonationDto[]): DonationSummary {
        if (donations.length === 0) {
            return { totalDonations: 0, averageDonation: 0, largestDonation: 0, smallestDonation: 0 };
        }
        const amounts = donations.map(d => d.amount);
        const total = amounts.reduce((sum, a) => sum + a, 0);
        return {
            totalDonations: total,
            averageDonation: total / donations.length,
            largestDonation: Math.max(...amounts),
            smallestDonation: Math.min(...amounts)
        };
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' TND';
    }
}
