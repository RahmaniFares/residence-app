import { Component, computed, inject, OnInit, OnDestroy, Signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { PaymentServices } from './payment-services';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PaymentModel, PaymentStatus, UpdatePaymentDto } from './payment-model';
import { TarifService } from '../tarifs/tarif-service';
import { TarifDto, TarifHistoryDto } from '../tarifs/tarif-model';
import { environment } from '../../../environments/environment';
import { signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  router = inject(Router);
  paymentService = inject(PaymentServices);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);
  tarifService = inject(TarifService);
  PaymentStatus = PaymentStatus;
  protected Math = Math;
  toastr = inject(ToastrService);

  payments = toSignal(this.paymentService.payments$, { initialValue: [] });
  pagination: Signal<any> = toSignal(this.paymentService.pagination$, {
    initialValue: {
      totalCount: 0,
      pageNumber: 1,
      pageSize: 5,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    }
  }) as any;
  loading = toSignal(this.paymentService.loading$, { initialValue: false });
  tarifs = signal<TarifDto[]>([]);
  tarifHistory = signal<TarifHistoryDto[]>([]);
  pageSizes = [5, 10];

  // Modal States
  showDeleteModal = signal(false);
  paymentToDelete = signal<PaymentModel | null>(null);

  showEditModal = signal(false);
  paymentToEdit = signal<PaymentModel | null>(null);
  editForm = signal<UpdatePaymentDto>({});

  hasNextPage = computed(() => this.pagination().pageNumber < this.pagination().totalPages);
  hasPreviousPage = computed(() => this.pagination().pageNumber > 1);

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
    this.paymentService.loadPayments(1, 5).pipe(takeUntil(this.destroy$)).subscribe();
    this.houseService.loadHouses(1, 115).pipe(takeUntil(this.destroy$)).subscribe();
    this.residentService.loadResidents(1, 115).pipe(takeUntil(this.destroy$)).subscribe();

    // Load current tarifs and history to calculate expected monthly dues
    this.tarifService.getTarifsByResidence(environment.residenceId).pipe(takeUntil(this.destroy$)).subscribe(t => this.tarifs.set(t));
    this.tarifService.getResidenceTarifHistory(environment.residenceId).pipe(takeUntil(this.destroy$)).subscribe(h => this.tarifHistory.set(h));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.paymentService.loadPayments(page, this.pagination().pageSize).pipe(takeUntil(this.destroy$)).subscribe();
  }

  onPageSizeChange(size: string) {
    const pageSize = Number(size) || 10;
    this.paymentService.loadPayments(1, pageSize).pipe(takeUntil(this.destroy$)).subscribe();
  }

  addPayment() {
    this.router.navigate(['/dashboard/add-payment']);
  }

  openEditModal(payment: PaymentModel) {
    this.paymentToEdit.set(payment);
    this.editForm.set({
      amount: payment.amount,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      paymentDate: payment.paymentDate,
      status: payment.status
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.paymentToEdit.set(null);
  }

  savePaymentUpdate() {
    const payment = this.paymentToEdit();
    const form = this.editForm();
    if (!payment) return;

    this.paymentService.updatePayment(payment.id, form).subscribe({
      next: () => {
        this.toastr.success('Paiement mis à jour avec succès');
        this.closeEditModal();
        // Refresh the current page
        this.onPageChange(this.pagination().pageNumber);
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.toastr.error('Échec de la mise à jour');
      }
    });
  }

  openDeleteModal(payment: PaymentModel) {
    this.paymentToDelete.set(payment);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.paymentToDelete.set(null);
  }

  confirmDelete() {
    const payment = this.paymentToDelete();
    if (!payment) return;

    this.paymentService.deletePayment(payment.id).subscribe({
      next: () => {
        this.toastr.success('Paiement supprimé');
        this.closeDeleteModal();
        // Refresh the current page
        this.onPageChange(this.pagination().pageNumber);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.toastr.error('Échec de la suppression');
      }
    });
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
    
    // Accurate month difference including the end month
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
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
