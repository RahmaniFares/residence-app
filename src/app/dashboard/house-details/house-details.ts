import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-house-details',
  imports: [],
  templateUrl: './house-details.html',
  styleUrl: './house-details.css',
})
export class HouseDetails {
  constructor(private router: Router) { }

  back() {
    this.router.navigate(['dashboard/houses']);
  }

  showPaymentForm() {
    this.router.navigate(['dashboard/add-payment']);
  }
}
