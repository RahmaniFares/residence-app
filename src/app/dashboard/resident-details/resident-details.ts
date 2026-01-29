import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { IncidentServices } from '../incidents/incident-services';
import { IncidentModel } from '../incidents/incident-model';
import { PaymentServices } from '../payments/payment-services';
import { PaymentModel } from '../payments/payment-model';
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

  // Computed stats
  paidMonthsCount = computed(() => this.payments().filter(p => p.status === 'Paid').length);
  unpaidMonthsCount = computed(() => this.payments().filter(p => p.status === 'Pending' || p.status === 'Overdue').length);
  activeIncidentsCount = computed(() => this.incidents().filter(i => i.status === 'Open' || i.status === 'In Progress').length);


  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const foundResident = this.residentService.getResidentById(id);
        this.resident.set(foundResident);

        if (foundResident) {
          // Subscribe to incidents and filter
          this.incidentService.incidents$.subscribe(all => {
            this.incidents.set(all.filter(i => i.residentId === id));
          });

          // Subscribe to payments and filter
          this.paymentService.payments$.subscribe(all => {
            this.payments.set(all.filter(p => p.residentId === id));
          });
        }
      }
    });
  }

  back() {
    this.router.navigate(['./dashboard/residents']);
  }

  setActiveTab(tab: 'payments' | 'incidents' | 'documents') {
    this.activeTab.set(tab);
  }
}
