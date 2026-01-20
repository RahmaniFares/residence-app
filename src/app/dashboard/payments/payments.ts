import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-payments',
  imports: [],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments {

  constructor(private router: Router) { }

  addPayment() {
    this.router.navigate(['/dashboard/add-payment']);
  }
}
