import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HouseModel } from '../houses/house-model';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-house-details',
  imports: [CommonModule],
  templateUrl: './house-details.html',
  styleUrl: './house-details.css',
})
export class HouseDetails implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);

  house = signal<HouseModel | undefined>(undefined);
  resident = signal<ResidentModel | undefined>(undefined);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const foundHouse = this.houseService.getHouseById(id);
        this.house.set(foundHouse);
        if (foundHouse?.residentId) {
          const foundResident = this.residentService.getResidentById(foundHouse.residentId);
          this.resident.set(foundResident);
        } else {
          this.resident.set(undefined);
        }
      }
    });
  }

  back() {
    this.router.navigate(['dashboard/houses']);
  }

  showPaymentForm() {
    this.router.navigate(['dashboard/add-payment']);
  }
}
