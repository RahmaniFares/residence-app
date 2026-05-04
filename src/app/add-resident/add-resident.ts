import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ResidentServices } from '../dashboard/residents/resident-services';
import { HouseServices } from '../dashboard/houses/house-services';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ResidentModel } from '../dashboard/residents/resident-model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-add-resident',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './add-resident.html',
  styleUrl: './add-resident.css',
})
export class AddResident implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  residentService = inject(ResidentServices);
  houseService = inject(HouseServices);

  // Autocomplete state
  houseSearchQuery = signal('');
  showHouseDropdown = signal(false);
  selectedHouseId = signal('');

  residentId: string | null = null;
  isEditMode = false;

  // Use HouseServices to get real houses
  houses = toSignal(this.houseService.houses$, { initialValue: [] });

  // Filtered houses based on search query
  filteredHouses = computed(() => {
    const query = this.houseSearchQuery().toLowerCase();
    const allHouses = this.houses();

    if (!query) return allHouses.slice(0, 3); // Show first 10 if no query

    return allHouses.filter(h =>
      h.block.toLowerCase().includes(query) ||
      h.unit.toLowerCase().includes(query) ||
      `Maison${h.block} ${h.floor}-${h.unit}`.toLowerCase().includes(query)
    ).slice(0, 3);
  });

  // Get selected house name for display
  selectedHouseName = computed(() => {
    const id = this.selectedHouseId();
    if (!id) return '';
    const house = this.houses().find(h => h.id === id);
    return house ? `Maison${house.block} ${house.floor}-${house.unit}` : '';
  });

  residentForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    birthDate: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    status: ['Active', Validators.required]
  });

  ngOnInit() {
    this.residentId = this.route.snapshot.paramMap.get('id');
    if (this.residentId) {
      this.isEditMode = true;
      this.residentService.getResidentByIdFromApi(this.residentId).subscribe({
        next: (resident) => {
          this.residentForm.patchValue({
            firstName: resident.firstName,
            lastName: resident.lastName,
            birthDate: resident.birthDate ? resident.birthDate.split('T')[0] : '',
            phone: resident.phoneNumber,
            email: resident.email,
            status: 'Active'
          });

        },
        error: (err) => console.error('Failed to load resident:', err)
      });
    }
  }



  hideDropdown() {
    // Delay to allow click on dropdown to trigger first
    setTimeout(() => this.showHouseDropdown.set(false), 200);
  }



  back() {
    this.router.navigate(['dashboard/residents']);
  }

  save() {
    if (this.residentForm.valid) {
      const formValue = this.residentForm.value;

      if (this.isEditMode && this.residentId) {
        // Construct the model directly from form values for update
        const updatedResident: ResidentModel = {
          id: this.residentId,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          phone: formValue.phone,
          status: formValue.status,
          birthDate: formValue.birthDate,
          createdAt: new Date().toISOString() // Placeholder
        };

        this.residentService.updateResident(updatedResident).subscribe({
          next: () => this.router.navigate(['dashboard/residents']),
          error: (err) => console.error('Failed to update resident:', err)
        });
      } else {
        this.residentService.addResident(formValue).subscribe({
          next: () => this.router.navigate(['dashboard/residents']),
          error: (err) => console.error('Failed to add resident:', err)
        });
      }
    } else {
      this.residentForm.markAllAsTouched();
    }
  }
}
