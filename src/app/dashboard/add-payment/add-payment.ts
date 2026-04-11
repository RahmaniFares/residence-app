import { Component, computed, inject, signal, effect, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PaymentServices } from '../payments/payment-services';
import { HouseServices, HouseDetailsDto } from '../houses/house-services';
import { HouseModel, HouseStatus } from '../houses/house-model';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PaymentModel, CreatePaymentDto, PaymentStatus } from '../payments/payment-model';
import { TarifService } from '../tarifs/tarif-service';
import { TarifDto, TarifHistoryDto } from '../tarifs/tarif-model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-payment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './add-payment.html',
  styleUrl: './add-payment.css',
})
export class AddPayment implements OnInit {

  router = inject(Router);
  fb = inject(FormBuilder);
  paymentService = inject(PaymentServices);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);
  tarifService = inject(TarifService);
  route = inject(ActivatedRoute);
  toastr = inject(ToastrService);

  houses = toSignal(this.houseService.houses$, { initialValue: [] });
  residents = toSignal(this.residentService.residents$, { initialValue: [] });
  tarifs = signal<TarifDto[]>([]);
  tarifHistory = signal<TarifHistoryDto[]>([]);
  prefetchedHouse = signal<HouseDetailsDto | undefined>(undefined);
  isHouseFixed = signal(false);
  hideUpload = signal(false);
  housePayments = signal<PaymentModel[]>([]);

  paymentForm = this.fb.group({
    houseId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  // Signals for UI calculations
  selectedHouseId = signal('');
  startDate = signal('');
  endDate = signal('');

  constructor() {
    // Sync form changes to signals
    this.paymentForm.get('houseId')?.valueChanges.subscribe((val: string | null) => this.selectedHouseId.set(val || ''));
    this.paymentForm.get('startDate')?.valueChanges.subscribe((val: string | null) => this.startDate.set(val || ''));
    this.paymentForm.get('endDate')?.valueChanges.subscribe((val: string | null) => this.endDate.set(val || ''));

    // Effect to fetch payments when house changes
    effect(() => {
      const hId = this.selectedHouseId();
      if (hId) {
        this.paymentService.loadPaymentsByHouse(hId, 1, 100).subscribe({
          next: (res) => {
            const mapped = res.items.map(p => ({
              id: p.id,
              houseId: p.houseId,
              residentId: p.residentId,
              amount: p.amount,
              paymentDate: p.paymentDate,
              periodStart: p.periodStart,
              periodEnd: p.periodEnd,
              status: p.status,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt
            } as PaymentModel));
            this.housePayments.set(mapped);

            // Auto-suggest next start date
            if (mapped.length > 0) {
              // Find latest periodEnd
              const latestPayment = [...mapped].sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())[0];
              if (latestPayment) {
                const lastEnd = new Date(latestPayment.periodEnd);
                const nextMonth = new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 2, 1);
                const nextMonthStr = nextMonth.toISOString().substring(0, 7); // YYYY-MM

                this.paymentForm.patchValue({ startDate: nextMonthStr });
                this.paymentForm.get('startDate')?.disable();
              }
            } else {
              this.paymentForm.get('startDate')?.enable();
            }
          }
        });
      } else {
        this.housePayments.set([]);
        this.paymentForm.get('startDate')?.enable();
      }
    });
  }

  ngOnInit() {
    // Enforce loading of houses and residents for the dropdown and lookup
    this.houseService.loadHouses(1, 100).subscribe(() => {
      // Check for houseId in query params
      this.route.queryParams.subscribe(params => {
        const hId = params['houseId'];
        if (hId) {
          this.paymentForm.patchValue({ houseId: hId });
          this.paymentForm.get('houseId')?.disable();
          this.selectedHouseId.set(hId);
          this.isHouseFixed.set(true);
          this.hideUpload.set(true);

          // Fetch detailed info
          this.houseService.getHouseDetailsFromApi(hId).subscribe({
            next: (details) => this.prefetchedHouse.set(details),
            error: (err) => console.error('Failed to load prefilled house details:', err)
          });
        }
      });
    });
    this.residentService.loadResidents(1, 100).subscribe();
    this.tarifService.getTarifsByResidence(environment.residenceId).subscribe(t => this.tarifs.set(t));
    this.tarifService.getResidenceTarifHistory(environment.residenceId).subscribe(h => this.tarifHistory.set(h));
  }

  selectedHouse = computed(() => {
    const prefetched = this.prefetchedHouse();
    if (prefetched && prefetched.id === this.selectedHouseId()) {
      return {
        id: prefetched.id,
        block: prefetched.block,
        unit: prefetched.unit,
        floor: prefetched.floor,
        status: prefetched.status,
        residentId: prefetched.currentResidentId
      } as HouseModel;
    }
    return this.houses().find(h => h.id === this.selectedHouseId());
  });

  resident = computed(() => {
    const prefetched = this.prefetchedHouse();
    if (prefetched && prefetched.id === this.selectedHouseId() && prefetched.currentResident) {
      const cr = prefetched.currentResident;
      return {
        id: cr.id,
        firstName: cr.firstName,
        lastName: cr.lastName,
        email: cr.email,
        phone: cr.phoneNumber || '',
        status: 'Active',
        createdAt: cr.createdAt
      } as ResidentModel;
    }

    const house = this.selectedHouse();
    if (house?.residentId) {
      return this.residents().find(r => r.id === house.residentId);
    }
    return null;
  });

  monthsCount = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return 0;

    // Assume input type="month" format YYYY-MM
    const startDate = new Date(start + '-01');
    const endDate = new Date(end + '-01');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    return months >= 0 ? months + 1 : 0; // Inclusive count
  });

  totalAmount = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return 0;

    const startDate = new Date(start + '-01');
    const endDate = new Date(end + '-01');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

    let total = 0;
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= endMonth) {
      total += this.getRateForDate(current);
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return total;
  });

  paymentBreakdown = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return '';

    const startDate = new Date(start + '-01');
    const endDate = new Date(end + '-01');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

    const details: string[] = [];
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= endMonth) {
      const monthStr = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const rate = this.getRateForDate(current);
      details.push(`${monthStr} (${rate} TND)`);
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    if (details.length === 0) return '';
    return details.join(' + ');
  });

  overlappingMonths = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const existing = this.housePayments();

    if (!start || !end || existing.length === 0) return [];

    const selectedStart = new Date(start + '-01');
    const selectedEnd = new Date(end + '-01');

    const overlaps: string[] = [];

    // Check each month in selected range
    let current = new Date(selectedStart.getFullYear(), selectedStart.getMonth(), 1);
    const stop = new Date(selectedEnd.getFullYear(), selectedEnd.getMonth(), 1);

    while (current <= stop) {
      const isPaid = existing.some(p => {
        if (p.status !== PaymentStatus.Paid) return false;
        const pStart = new Date(p.periodStart);
        const pEnd = new Date(p.periodEnd);
        // Normalized dates to month start
        const ps = new Date(pStart.getFullYear(), pStart.getMonth(), 1);
        const pe = new Date(pEnd.getFullYear(), pEnd.getMonth(), 1);
        return current >= ps && current <= pe;
      });

      if (isPaid) {
        overlaps.push(current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
      }
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return overlaps;
  });

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

  back() {
    this.router.navigate(['/dashboard/payments']);
  }

  Cancel() {
    this.router.navigate(['/dashboard/payments']);
  }

  confirmPayment() {
    if (this.paymentForm.invalid || this.overlappingMonths().length > 0) return;

    const formVal = this.paymentForm.getRawValue();
    const house = this.selectedHouse();
    const resident = this.resident();

    if (!house || !resident) {
      this.toastr.warning('Veuillez sélectionner un appartement avec un résident actif');
      return;
    }

    const createDto: CreatePaymentDto = {
      houseId: house.id,
      residentId: resident.id,
      amount: this.totalAmount(),
      periodStart: formVal.startDate + '-01',
      periodEnd: (formVal.endDate || '') + '-28',
      paymentDate: new Date().toISOString(),
      status: PaymentStatus.Paid
    };

    this.paymentService.addPayment(createDto).subscribe({
      next: () => {
        this.toastr.success('Paiement enregistré avec succès');
        this.router.navigate(['/dashboard/payments']);
      },
      error: (err) => {
        console.error('Failed to save payment:', err);
        this.toastr.error('Échec de l\'enregistrement du paiement. Veuillez réessayer.');
      }
    });
  }
}
