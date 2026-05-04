import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DonationService } from '../../../services/donation.service';
import { DonationDto } from '../../../models/donation.model';

@Component({
  selector: 'app-donation-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donation-list.component.html',
  styleUrls: ['./donation-list.component.css']
})
export class DonationListComponent implements OnInit, OnDestroy {
  donations: DonationDto[] = [];
  loading = false;
  selectedDonation: DonationDto | null = null;
  private destroy$ = new Subject<void>();

  constructor(private donationService: DonationService) {}

  ngOnInit(): void {
	this.loadDonations();

	// Subscribe to donations
	this.donationService.donations$
	  .pipe(takeUntil(this.destroy$))
	  .subscribe(donations => {
		this.donations = donations;
	  });

	// Subscribe to loading state
	this.donationService.loading$
	  .pipe(takeUntil(this.destroy$))
	  .subscribe(loading => {
		this.loading = loading;
	  });
  }

  loadDonations(): void {
	this.donationService.getAllDonations()
	  .pipe(takeUntil(this.destroy$))
	  .subscribe({
		next: (data) => {
		  this.donations = data;
		},
		error: (error) => {
		  console.error('Error loading donations:', error);
		}
	  });
  }

  selectDonation(donation: DonationDto): void {
	this.donationService.setSelectedDonation(donation);
	this.selectedDonation = donation;
  }

  deleteDonation(id: string): void {
	if (confirm('Are you sure you want to delete this donation?')) {
	  this.donationService.deleteDonation(id)
		.pipe(takeUntil(this.destroy$))
		.subscribe({
		  next: () => {
			this.donations = this.donations.filter(d => d.id !== id);
		  },
		  error: (error) => {
			console.error('Error deleting donation:', error);
		  }
		});
	}
  }

  ngOnDestroy(): void {
	this.destroy$.next();
	this.destroy$.complete();
  }
}
