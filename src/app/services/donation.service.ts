import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DonationDto,
  DonationDetailDto,
  CreateDonationDto,
  UpdateDonationDto,
  DonationSummary,
  DonationByHouseSummary
} from '../models/donation.model';

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  private apiUrl = `${environment.apiUrl}/donations`;

  // Subject for reactive data management
  private donationsSubject = new BehaviorSubject<DonationDto[]>([]);
  public donations$ = this.donationsSubject.asObservable();

  private selectedDonationSubject = new BehaviorSubject<DonationDto | null>(null);
  public selectedDonation$ = this.selectedDonationSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * CRUD Operations
   */

  /**
   * Create a new donation
   */
  createDonation(donation: CreateDonationDto): Observable<DonationDto> {
	return this.http.post<DonationDto>(`${this.apiUrl}/`, donation);
  }

  /**
   * Get donation by ID
   */
  getDonationById(id: string): Observable<DonationDto> {
	return this.http.get<DonationDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update donation
   */
  updateDonation(id: string, donation: UpdateDonationDto): Observable<DonationDto> {
	return this.http.put<DonationDto>(`${this.apiUrl}/${id}`, donation);
  }

  /**
   * Delete donation
   */
  deleteDonation(id: string): Observable<void> {
	return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Query Operations
   */

  /**
   * Get all donations
   */
  getAllDonations(): Observable<DonationDto[]> {
    this.setLoading(true);
    return this.http.get<DonationDto[]>(`${this.apiUrl}/`).pipe(
      tap({
        next: (donations) => {
          this.donationsSubject.next(donations);
          this.setLoading(false);
        },
        error: () => this.setLoading(false)
      })
    );
  }

  /**
   * Get donations by house
   */
  getDonationsByHouse(houseId: string): Observable<DonationDto[]> {
	return this.http.get<DonationDto[]>(`${this.apiUrl}/house/${houseId}`);
  }

  /**
   * Get donations by donor
   */
  getDonationsByDonor(donorId: string): Observable<DonationDto[]> {
	return this.http.get<DonationDto[]>(`${this.apiUrl}/donor/${donorId}`);
  }

  /**
   * Get donations by date range
   */
  getDonationsByDateRange(
	startDate: Date,
	endDate: Date
  ): Observable<DonationDto[]> {
	const params = new HttpParams()
	  .set('startDate', this.formatDate(startDate))
	  .set('endDate', this.formatDate(endDate));

	return this.http.get<DonationDto[]>(`${this.apiUrl}/by-date-range`, { params });
  }

  /**
   * Statistics Operations
   */

  /**
   * Get total donations by house
   */
  getTotalDonationsByHouse(houseId: string): Observable<{ houseId: string; total: number }> {
	return this.http.get<{ houseId: string; total: number }>(
	  `${this.apiUrl}/house/${houseId}/total`
	);
  }

  /**
   * Get total donations by donor
   */
  getTotalDonationsByDonor(donorId: string): Observable<{ donorId: string; total: number }> {
	return this.http.get<{ donorId: string; total: number }>(
	  `${this.apiUrl}/statistics/total-by-donor?donorId=${donorId}`
	);
  }

  /**
   * Get donation details
   */
  getDonationDetails(id: string): Observable<DonationDetailDto> {
	return this.http.get<DonationDetailDto>(`${this.apiUrl}/${id}/details`);
  }

  /**
   * Helper Methods
   */

  /**
   * Set selected donation
   */
  setSelectedDonation(donation: DonationDto): void {
	this.selectedDonationSubject.next(donation);
  }

  /**
   * Clear selected donation
   */
  clearSelectedDonation(): void {
	this.selectedDonationSubject.next(null);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
	this.loadingSubject.next(loading);
  }

  /**
   * Format date to ISO string
   */
  private formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
  }

  /**
   * Update donations list
   */
  refreshDonations(): Observable<DonationDto[]> {
	this.setLoading(true);
	return this.http.get<DonationDto[]>(`${this.apiUrl}/`);
  }

  /**
   * Calculate donation statistics
   */
  calculateStats(donations: DonationDto[]): DonationSummary {
	if (donations.length === 0) {
	  return {
		totalDonations: 0,
		averageDonation: 0,
		largestDonation: 0,
		smallestDonation: 0
	  };
	}

	const amounts = donations.map(d => d.amount);
	const total = amounts.reduce((sum, amount) => sum + amount, 0);

	return {
	  totalDonations: total,
	  averageDonation: total / donations.length,
	  largestDonation: Math.max(...amounts),
	  smallestDonation: Math.min(...amounts)
	};
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', { 
        style: 'currency', 
        currency: 'TND',
        minimumFractionDigits: 2 
    }).format(amount);
  }
}
