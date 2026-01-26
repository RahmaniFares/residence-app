import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentServices } from './payment-services';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payments',
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments {

  router = inject(Router);
  paymentService = inject(PaymentServices);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);

  payments = toSignal(this.paymentService.payments$, { initialValue: [] });
  budgetStats = computed(() => this.paymentService.getBudgetOverview());

  addPayment() {
    this.router.navigate(['/dashboard/add-payment']);
  }

  getHouseDetails(houseId: string) {
    const house = this.houseService.getHouseById(houseId);
    return house ? `${house.block}, Unit ${house.unit}` : 'Unknown House';
  }

  getResidentName(residentId: string) {
    const resident = this.residentService.getResidentById(residentId);
    return resident ? `${resident.firstName} ${resident.lastName}` : 'Unknown Resident';
  }

  getMonthsCount(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Rough calculation
    return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }
}
