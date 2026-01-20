import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-payment',
  imports: [],
  templateUrl: './add-payment.html',
  styleUrl: './add-payment.css',
})
export class AddPayment {
  constructor(private router: Router) { }

  back() {
    window.history.back();
  }

  Cancel() {
    this.router.navigate(['/dashboard/payments']);
  }
}
