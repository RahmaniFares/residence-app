import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-houses',
  imports: [],
  templateUrl: './houses.html',
  styleUrl: './houses.css',
})
export class Houses {

  constructor(private router: Router) { }

  showHouseDetails(id: string) {
    this.router.navigate(['dashboard/house-details']);
  }
}
