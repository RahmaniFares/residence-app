import { Component, computed, inject, OnInit, signal, HostListener, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HouseModel, HouseStatus } from '../houses/house-model';
import { HouseServices, HouseFinancialStatementDto } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { PaymentServices } from '../payments/payment-services';
import { PaymentModel, PaymentStatus } from '../payments/payment-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TarifService } from '../tarifs/tarif-service';
import { TarifDto, TarifHistoryDto } from '../tarifs/tarif-model';
import { environment } from '../../../environments/environment';
import { LoginService } from '../../login/login-service';
import { UserRole } from '../users/user-model';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UpdatePaymentDto } from '../payments/payment-model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-house-details',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './house-details.html',
  styleUrl: './house-details.css',
})
export class HouseDetails implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);
  paymentService = inject(PaymentServices);
  toastr = inject(ToastrService);
  loginService = inject(LoginService);

  house = signal<HouseModel | undefined>(undefined);
  resident = signal<ResidentModel | undefined>(undefined);
  residents = signal<ResidentModel[]>([]);
  showResidentModal = signal(false);
  selectedResidentId: string | undefined = undefined;
  isUpdating = signal(false);
  financialStatement = signal<HouseFinancialStatementDto | null>(null);
  private destroy$ = new Subject<void>();
  showAllPayments = signal(false);
  isResident = signal(false);
  isNavHidden = signal(false);
  private lastScrollTop = 0;


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
  pageSizes = [5, 10];
  protected Math = Math;

  // Modal States for Payments
  showDeleteModalPayment = signal(false);
  paymentToDelete = signal<PaymentModel | null>(null);

  showEditModalPayment = signal(false);
  paymentToEdit = signal<PaymentModel | null>(null);
  editForm = signal<UpdatePaymentDto>({});

  hasNextPage = computed(() => this.pagination().pageNumber < this.pagination().totalPages);
  hasPreviousPage = computed(() => this.pagination().pageNumber > 1);

  tarifService = inject(TarifService);
  currentYear = signal(new Date().getFullYear());
  tarifs = signal<TarifDto[]>([]);
  tarifHistory = signal<TarifHistoryDto[]>([]);

  HouseStatus = HouseStatus; // Make enum accessible in template
  PaymentStatus = PaymentStatus;

  visiblePayments = computed(() => {
    const all = this.payments();
    return this.showAllPayments() ? all : all.slice(0, 4);
  });

  monthlyStatus = computed(() => {
    const year = this.currentYear();
    const payments = this.payments();
    const history = this.tarifHistory();
    const tarifs = this.tarifs();

    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    return months.map((name, index) => {
      const monthDate = new Date(year, index, 1);

      // Find if this month is covered by any payment
      let isPaid = false;
      let paidTarif: number | null = null;

      for (const p of payments) {
        const start = new Date(p.periodStart);
        const end = new Date(p.periodEnd);
        // Normalize to floor of month
        const pStart = new Date(start.getFullYear(), start.getMonth(), 1);
        const pEnd = new Date(end.getFullYear(), end.getMonth(), 1);

        if (monthDate >= pStart && monthDate <= pEnd && p.status === PaymentStatus.Paid) {
          isPaid = true;

          if (p.lines && p.lines.length > 0) {
            // Find the line that covers this specific month
            const line = p.lines.find(l => {
              // monthDate is the first day of the month
              const lStart = new Date(l.fromYear, l.fromMonth - 1, 1);
              const lEnd = new Date(l.toYear, l.toMonth - 1, 1);
              return monthDate >= lStart && monthDate <= lEnd;
            });
            if (line) {
              paidTarif = line.tarif;
            }
          }
          break;
        }
      }

      // Find rate for this month (official rate based on history)
      const rate = this.getRateForDate(monthDate, tarifs, history);

      return {
        name,
        isPaid,
        rate,
        paidTarif,
        date: monthDate
      };
    });
  });

  getRateForDate(date: Date, tarifs: TarifDto[], history: TarifHistoryDto[]): number {
    let rate = 0;

    // Check baseline tarifs
    const activeTarif = tarifs.find(t => {
      const eff = new Date(t.effectiveDate);
      const end = t.endDate ? new Date(t.endDate) : new Date('2099-12-31');
      return eff <= date && date <= end;
    });

    if (activeTarif) {
      rate = activeTarif.amount;
    }

    // Overlay history (which often contains the most specific current rates)
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

  nextYear() {
    this.currentYear.update(y => y + 1);
  }

  prevYear() {
    this.currentYear.update(y => y - 1);
  }

  ngOnInit() {
    const userRole = this.loginService.getCurrentUser()?.role;
    this.isResident.set(Number(userRole) === UserRole.Resident);

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadHouseDetails(id);

        // Load payments for this specific house from the API
        this.paymentService.loadPaymentsByHouse(id, 1, 5).subscribe();

        // Load tarifs
        this.tarifService.getTarifsByResidence(environment.residenceId).pipe(takeUntil(this.destroy$)).subscribe(t => this.tarifs.set(t));
        this.tarifService.getResidenceTarifHistory(environment.residenceId).pipe(takeUntil(this.destroy$)).subscribe(h => this.tarifHistory.set(h));

        // Load financial statement
        this.houseService.getHouseFinancialStatement(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: stmt => this.financialStatement.set(stmt),
          error: err => console.error('Failed to load financial statement:', err)
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(page: number) {
    const id = this.house()?.id;
    if (!id || page < 1 || page > this.pagination().totalPages) return;
    this.paymentService.loadPaymentsByHouse(id, page, this.pagination().pageSize).pipe(takeUntil(this.destroy$)).subscribe();
  }

  onPageSizeChange(size: string) {
    const id = this.house()?.id;
    if (!id) return;
    const pageSize = Number(size) || 5;
    this.paymentService.loadPaymentsByHouse(id, 1, pageSize).pipe(takeUntil(this.destroy$)).subscribe();
  }

  openEditModalPayment(payment: PaymentModel) {
    this.paymentToEdit.set(payment);
    this.editForm.set({
      amount: payment.amount,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      paymentDate: payment.paymentDate,
      status: payment.status
    });
    this.showEditModalPayment.set(true);
  }

  closeEditModalPayment() {
    this.showEditModalPayment.set(false);
    this.paymentToEdit.set(null);
  }

  savePaymentUpdate() {
    const payment = this.paymentToEdit();
    const form = this.editForm();
    if (!payment) return;

    this.paymentService.updatePayment(payment.id, form).subscribe({
      next: () => {
        this.toastr.success('Paiement mis à jour avec succès');
        this.closeEditModalPayment();
        // Refresh the current page
        this.onPageChange(this.pagination().pageNumber);
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.toastr.error('Échec de la mise à jour');
      }
    });
  }

  openDeleteModalPayment(payment: PaymentModel) {
    this.paymentToDelete.set(payment);
    this.showDeleteModalPayment.set(true);
  }

  closeDeleteModalPayment() {
    this.showDeleteModalPayment.set(false);
    this.paymentToDelete.set(null);
  }

  confirmDeletePayment() {
    const payment = this.paymentToDelete();
    if (!payment) return;

    this.paymentService.deletePayment(payment.id).subscribe({
      next: () => {
        this.toastr.success('Paiement supprimé');
        this.closeDeleteModalPayment();
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
    return house ? ` ${house.block}  ${house.floor} - ${house.unit}` : 'Maison inconnue';
  }

  getResidentName(residentId: string) {
    const resident = this.residentService.getResidentById(residentId);
    return resident ? `${resident.firstName} ${resident.lastName}` : 'Résident inconnu';
  }

  getExpectedAmount(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let total = 0;

    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= endMonth) {
      total += this.getRateForDate(current, this.tarifs(), this.tarifHistory());
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return total;
  }

  private loadHouseDetails(id: string) {
    this.houseService.getHouseDetailsFromApi(id).subscribe({
      next: (dto) => {
        const mappedHouse: HouseModel = {
          id: dto.id,
          block: dto.block,
          unit: dto.unit,
          floor: dto.floor || '',
          status: dto.status,
          residentId: dto.currentResidentId
        };
        this.house.set(mappedHouse);

        if (dto.currentResident) {
          const mappedResident: ResidentModel = {
            id: dto.currentResident.id,
            firstName: dto.currentResident.firstName,
            lastName: dto.currentResident.lastName,
            email: dto.currentResident.email || '',
            phone: dto.currentResident.phoneNumber || '',
            status: 'Active',
            createdAt: dto.currentResident.createdAt?.split('T')[0] || ''
          };
          this.resident.set(mappedResident);
        } else {
          this.resident.set(undefined);
        }
      },
      error: (err) => console.error('Failed to load house details:', err)
    });
  }

  getStatusLabel(status: HouseStatus): string {
    return status === HouseStatus.Occupied ? 'Occupied' : 'Vacant';
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
    const h = this.house();
    if (h) {
      this.router.navigate(['dashboard/add-payment'], { queryParams: { houseId: h.id } });
    } else {
      this.router.navigate(['dashboard/add-payment']);
    }
  }

  togglePaymentHistory() {
    this.showAllPayments.update(v => !v);
  }

  openResidentModal() {
    this.selectedResidentId = this.house()?.residentId;
    this.showResidentModal.set(true);

    // Load residents list for selection
    this.residentService.loadResidents(1, 100).subscribe({
      next: (result) => {
        this.residents.set(result.items.map(r => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: r.phoneNumber || '',
          status: 'Active',
          createdAt: ''
        })));
      },
      error: (err) => {
        console.error('Failed to load residents:', err);
        this.toastr.error('Could not load residents list');
      }
    });
  }

  closeResidentModal() {
    this.showResidentModal.set(false);
  }

  saveResidentSelection() {
    const h = this.house();
    if (!h) return;

    const newResidentId = this.selectedResidentId;
    this.isUpdating.set(true);

    this.houseService.updateHouse(h.id, { ...h, residentId: newResidentId, status: HouseStatus.Occupied }).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.showResidentModal.set(false);
        this.toastr.success('Resident updated successfully');

        // Update local state
        this.loadHouseDetails(h.id);
      },
      error: (err) => {
        this.isUpdating.set(false);
        console.error('Failed to update house resident:', err);
        this.toastr.error('Failed to update resident');
      }
    });
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Paid: return 'Paid';
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Overdue: return 'Overdue';
      default: return 'Unknown';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > this.lastScrollTop && st > 150) {
      // Scroll Down
      this.isNavHidden.set(true);
    } else {
      // Scroll Up
      this.isNavHidden.set(false);
    }
    this.lastScrollTop = st <= 0 ? 0 : st;
  }

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
