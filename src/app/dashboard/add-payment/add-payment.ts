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
  route = inject(ActivatedRoute);
  toastr = inject(ToastrService);

  houses = toSignal(this.houseService.houses$, { initialValue: [] });
  prefetchedHouse = signal<HouseDetailsDto | undefined>(undefined);
  isHouseFixed = signal(false);
  hideUpload = signal(false);

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
      return this.residentService.getResidentById(house.residentId);
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
    return this.monthsCount() * 150; // Assuming 150 per month
  });

  back() {
    this.router.navigate(['/dashboard/payments']);
  }

  Cancel() {
    this.router.navigate(['/dashboard/payments']);
  }

  confirmPayment() {
    if (this.paymentForm.invalid) return;

    const formVal = this.paymentForm.getRawValue();
    const house = this.selectedHouse();
    const resident = this.resident();

    if (!house || !resident) {
      this.toastr.warning('Please select a unit with an active resident');
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
        this.toastr.success('Payment recorded successfully');
        this.router.navigate(['/dashboard/payments']);
      },
      error: (err) => {
        console.error('Failed to save payment:', err);
        this.toastr.error('Failed to record payment. Please try again.');
      }
    });
  }
}
