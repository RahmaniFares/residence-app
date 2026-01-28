import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HouseModel } from '../houses/house-model';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { PaymentServices } from '../payments/payment-services';
import { PaymentModel } from '../payments/payment-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-house-details',
  imports: [CommonModule],
  templateUrl: './house-details.html',
  styleUrl: './house-details.css',
})
export class HouseDetails implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);
  paymentService = inject(PaymentServices);

  house = signal<HouseModel | undefined>(undefined);
  resident = signal<ResidentModel | undefined>(undefined);
  payments = signal<PaymentModel[]>([]);
  showAllPayments = signal(false);

  visiblePayments = computed(() => {
    const all = this.payments();
    return this.showAllPayments() ? all : all.slice(0, 4);
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const foundHouse = this.houseService.getHouseById(id);
        this.house.set(foundHouse);
        if (foundHouse?.residentId) {
          const foundResident = this.residentService.getResidentById(foundHouse.residentId);
          this.resident.set(foundResident);
        } else {
          this.resident.set(undefined);
        }

        // Subscribe to payments and filter by houseId
        this.paymentService.payments$.subscribe(allPayments => {
          const housePayments = allPayments.filter(p => p.houseId === id);
          this.payments.set(housePayments);
        });
      }
    });
  }

  getMonthsCount(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Rough calculation
    return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }

  back() {
    this.router.navigate(['dashboard/houses']);
  }

  showPaymentForm() {
    this.router.navigate(['dashboard/add-payment']);
  }

  togglePaymentHistory() {
    this.showAllPayments.update(v => !v);
  }
}
