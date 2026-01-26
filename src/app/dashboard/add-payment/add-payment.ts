import { Component, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PaymentServices } from '../payments/payment-services';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { PaymentModel } from '../payments/payment-model';

@Component({
  selector: 'app-add-payment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './add-payment.html',
  styleUrl: './add-payment.css',
})
export class AddPayment {

  router = inject(Router);
  fb = inject(FormBuilder);
  paymentService = inject(PaymentServices);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);

  houses = toSignal(this.houseService.houses$, { initialValue: [] });

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
    this.paymentForm.get('houseId')?.valueChanges.subscribe(val => this.selectedHouseId.set(val || ''));
    this.paymentForm.get('startDate')?.valueChanges.subscribe(val => this.startDate.set(val || ''));
    this.paymentForm.get('endDate')?.valueChanges.subscribe(val => this.endDate.set(val || ''));
  }

  selectedHouse = computed(() => {
    return this.houses().find(h => h.id === this.selectedHouseId());
  });

  resident = computed(() => {
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

    const formVal = this.paymentForm.value;
    const house = this.selectedHouse();
    const resident = this.resident();

    if (!house || !resident) return;

    const newPayment: PaymentModel = {
      id: `PAY-${Date.now()}`, // Simple ID generation
      houseId: house.id,
      residentId: resident.id,
      amount: this.totalAmount(),
      // paymentDate: new Date().toISOString().split('T')[0], // Marking as paid now? Or adding a record? 
      // User request said "add new payments", implied recording a transaction.
      paymentDate: new Date().toISOString().split('T')[0],
      periodStart: formVal.startDate + '-01',
      periodEnd: formVal.endDate + '-28', // Approximation
      status: 'Paid'
    };

    this.paymentService.addPayment(newPayment);
    this.router.navigate(['/dashboard/payments']);
  }
}
