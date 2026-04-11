import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentServices } from './payment-services';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PaymentStatus } from './payment-model';
import { TarifService } from '../tarifs/tarif-service';
import { TarifDto, TarifHistoryDto } from '../tarifs/tarif-model';
import { environment } from '../../../environments/environment';
import { signal } from '@angular/core';

@Component({
  selector: 'app-payments',
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments implements OnInit {

  router = inject(Router);
  paymentService = inject(PaymentServices);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);
  tarifService = inject(TarifService);
  PaymentStatus = PaymentStatus;
  protected Math = Math;

  payments = toSignal(this.paymentService.payments$, { initialValue: [] });
  pagination = toSignal(this.paymentService.pagination$, { initialValue: { totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false } });
  tarifs = signal<TarifDto[]>([]);
  tarifHistory = signal<TarifHistoryDto[]>([]);

  budgetStats = computed(() => {
    const allPayments = this.payments() || [];
    let totalExpected = 0;
    let collected = 0;

    allPayments.forEach(p => {
      totalExpected += this.getExpectedAmount(p.periodStart, p.periodEnd);
      if (p.status === PaymentStatus.Paid) {
        collected += p.amount;
      }
    });

    return {
      totalBudget: totalExpected,
      collectedAmount: collected,
      outstandingAmount: Math.max(0, totalExpected - collected),
      budgetChangePercentage: 12
    };
  });

  ngOnInit() {
    this.paymentService.loadPayments(1, 10).subscribe();
    this.houseService.loadHouses(1, 100).subscribe();
    this.residentService.loadResidents(1, 100).subscribe();

    // Load current tarifs and history to calculate expected monthly dues
    this.tarifService.getTarifsByResidence(environment.residenceId).subscribe(t => this.tarifs.set(t));
    this.tarifService.getResidenceTarifHistory(environment.residenceId).subscribe(h => this.tarifHistory.set(h));
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.paymentService.loadPayments(page, this.pagination().pageSize).subscribe();
  }

  addPayment() {
    this.router.navigate(['/dashboard/add-payment']);
  }

  getHouseDetails(houseId: string) {
    const house = this.houseService.getHouseById(houseId);
    return house ? ` ${house.block}  ${house.floor} - ${house.unit}` : 'Unknown House';
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

  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Paid: return 'Paid';
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Overdue: return 'Overdue';
      default: return 'Unknown';
    }
  }

  getExpectedAmount(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let total = 0;

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= endMonth) {
      total += this.getRateForDate(current);
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return total;
  }

  getRateForDate(date: Date): number {
    const history = this.tarifHistory();
    const tarifs = this.tarifs();

    let rate = 0;

    const activeTarif = tarifs.find(t => {
      const eff = new Date(t.effectiveDate);
      const end = t.endDate ? new Date(t.endDate) : new Date('2099-12-31');
      return eff <= date && date <= end;
    });

    if (activeTarif) {
      rate = activeTarif.amount;
    }

    if (history && history.length > 0) {
      const sortedHistory = [...history].sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
      for (const h of sortedHistory) {
        if (new Date(h.effectiveDate) <= date) {
          rate = h.newAmount;
        }
      }
    }

    return rate;
  }
}
