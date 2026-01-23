import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ResidentServices } from '../dashboard/residents/resident-services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-resident',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-resident.html',
  styleUrl: './add-resident.css',
})
export class AddResident implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  residentService = inject(ResidentServices);

  selectedHouse = signal('');
  residentId: string | null = null;
  isEditMode = false;

  houses = [
    { id: '1', name: 'Block A,Unit 101' },
    { id: '2', name: 'Block B,Unit 202' },
    { id: '3', name: 'Block C,Unit 303' },
    { id: '4', name: 'Block D,Unit 404' },
  ];
  residentForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    House: ['', Validators.required],
    address: ['', Validators.required],
    birthDate: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    status: ['Active', Validators.required]
  });

  ngOnInit() {
    this.residentId = this.route.snapshot.paramMap.get('id');
    if (this.residentId) {
      this.isEditMode = true;
      const resident = this.residentService.getResidentById(this.residentId);
      if (resident) {
        this.residentForm.patchValue({
          firstName: resident.firstName,
          lastName: resident.lastName,
          House: resident.House, // Note: This might need adjustment if House ID needs matching
          address: resident.address,
          birthDate: resident.birthDate,
          phone: resident.phone,
          email: resident.email,
          status: resident.status
        });

        // Find matching house ID if possible, otherwise keep string (select might not show correctly if IDs don't match)
        const houseOption = this.houses.find(h => h.name === resident.House);
        if (houseOption) {
          this.residentForm.patchValue({ House: houseOption.id });
        }
      }
    }
  }

  back() {
    this.router.navigate(['dashboard/residents']);
  }

  save() {
    if (this.residentForm.valid) {
      if (this.isEditMode && this.residentId) {
        const currentResident = this.residentService.getResidentById(this.residentId);
        if (currentResident) {
          const selectedHouseName = this.houses.find(h => h.id === this.residentForm.value.House)?.name || this.residentForm.value.House;

          this.residentService.updateResident({
            ...currentResident,
            ...this.residentForm.value,
            House: selectedHouseName,
            block: selectedHouseName.split(',')[0]
          });
        }
      } else {
        const selectedHouseName = this.houses.find(h => h.id === this.residentForm.value.House)?.name || this.residentForm.value.House;
        const formValue = { ...this.residentForm.value, House: selectedHouseName };
        this.residentService.addResident(formValue);
      }
      this.router.navigate(['dashboard/residents']);
    } else {
      this.residentForm.markAllAsTouched();
    }
  }
}
