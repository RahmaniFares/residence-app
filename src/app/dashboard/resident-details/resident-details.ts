import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { IncidentServices } from '../incidents/incident-services';
import { IncidentModel, IncidentStatus } from '../incidents/incident-model';
import { PaymentServices } from '../payments/payment-services';
import { PaymentModel, PaymentStatus } from '../payments/payment-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resident-details',
  imports: [CommonModule],
  templateUrl: './resident-details.html',
  styleUrl: './resident-details.css',
})
export class ResidentDetails implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  residentService = inject(ResidentServices);
  incidentService = inject(IncidentServices);
  paymentService = inject(PaymentServices);

  resident = signal<ResidentModel | undefined>(undefined);
  incidents = signal<IncidentModel[]>([]);
  payments = signal<PaymentModel[]>([]);
  activeTab = signal<'payments' | 'incidents' | 'documents'>('payments');
  PaymentStatus = PaymentStatus;
  IncidentStatus = IncidentStatus;

  // Computed stats
  paidMonthsCount = computed(() => this.payments().filter(p => p.status === PaymentStatus.Paid).length);
  unpaidMonthsCount = computed(() => this.payments().filter(p => p.status === PaymentStatus.Pending || p.status === PaymentStatus.Overdue).length);
  activeIncidentsCount = computed(() => this.incidents().filter(i => i.status === IncidentStatus.Open || i.status === IncidentStatus.InProgress).length);


  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Try synchronous lookup first (from cache)
        let foundResident = this.residentService.getResidentById(id);
        if (foundResident) {
          this.resident.set(foundResident);
          this.loadRelatedData(id);
        } else {
          // Fall back to API call
          this.residentService.getResidentByIdFromApi(id).subscribe({
            next: (dto) => {
              const mapped: ResidentModel = {
                id: dto.id,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phoneNumber || '',
                status: 'Active',
                createdAt: new Date().toISOString().split('T')[0],
              };
              this.resident.set(mapped);
              this.loadRelatedData(id);
            },
            error: (err) => console.error('Failed to load resident:', err)
          });
        }
      }
    });
  }

  private loadRelatedData(residentId: string) {
    // Subscribe to incidents and filter
    this.incidentService.incidents$.subscribe(all => {
      this.incidents.set(all.filter(i => i.residentId === residentId));
    });

    // Subscribe to payments and filter
    this.paymentService.payments$.subscribe(all => {
      this.payments.set(all.filter(p => p.residentId === residentId));
    });
  }

  back() {
    this.router.navigate(['./dashboard/residents']);
  }

  setActiveTab(tab: 'payments' | 'incidents' | 'documents') {
    this.activeTab.set(tab);
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Paid: return 'Paid';
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Overdue: return 'Overdue';
      default: return 'Unknown';
    }
  }
}
