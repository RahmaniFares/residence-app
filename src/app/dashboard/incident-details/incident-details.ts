import { Component, inject } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-incident-details',
  imports: [],
  templateUrl: './incident-details.html',
  styleUrl: './incident-details.css',
})
export class IncidentDetails {
  router = inject(Router);
  back() {
    this.router.navigate(['./dashboard/incidents']);
  }
}
