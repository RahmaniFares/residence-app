import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-resident',
  imports: [],
  templateUrl: './add-resident.html',
  styleUrl: './add-resident.css',
})
export class AddResident {

  constructor(private router: Router) { }

  back() {
    this.router.navigate(['dashboard/residents']);
  }

  save() {
    this.router.navigate(['dashboard/residents']);
  }
}
