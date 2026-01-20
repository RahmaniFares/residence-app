import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resident-details',
  imports: [],
  templateUrl: './resident-details.html',
  styleUrl: './resident-details.css',
})
export class ResidentDetails {

  router = inject(Router);

  back() {
    this.router.navigate(['./dashboard/residents']);
  }
}
