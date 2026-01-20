import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incidents',
  imports: [],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents {
  router = inject(Router);
  openIncident() {
    this.router.navigate(['./dashboard/incident-details']);
  }
}
