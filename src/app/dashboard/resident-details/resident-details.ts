import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resident-details',
  imports: [CommonModule],
  templateUrl: './resident-details.html',
  styleUrl: './resident-details.css',
})
export class ResidentDetails implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  residentService = inject(ResidentServices);

  resident = signal<ResidentModel | undefined>(undefined);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const foundResident = this.residentService.getResidentById(id);
        this.resident.set(foundResident);
      }
    });
  }

  back() {
    this.router.navigate(['./dashboard/residents']);
  }
}
