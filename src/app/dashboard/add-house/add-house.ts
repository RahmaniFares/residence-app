import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { HouseStatus } from '../houses/house-model';

@Component({
  selector: 'app-add-house',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-house.html',
  styleUrl: './add-house.css',
})
export class AddHouse {
  router = inject(Router);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);

  // Status signals
  loading = signal(false);
  errorMessage = signal('');

  // Form fields
  selectedBlock = signal('');
  selectedFloor = signal('');
  unit = signal('');
  selectedResidentId = signal('');
  residentSearchQuery = signal('');

  // Options
  blocks = signal(['Block A', 'Block B', 'Block C', 'Block D']);
  floors = signal(['1', '2', '3', '4', '5']);

  // Residents data
  residents = toSignal(this.residentService.residents$, { initialValue: [] });

  // Filtered residents based on search
  filteredResidents = computed(() => {
    const query = this.residentSearchQuery().toLowerCase();
    if (!query) return this.residents().slice(0, 5); // Show first 5 by default
    return this.residents().filter(r =>
      r.firstName.toLowerCase().includes(query) ||
      r.lastName.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query)
    ).slice(0, 5);
  });

  // Get selected resident name for display
  selectedResidentName = computed(() => {
    const id = this.selectedResidentId();
    if (!id) return '';
    const resident = this.residents().find(r => r.id === id);
    return resident ? `${resident.firstName} ${resident.lastName}` : '';
  });

  showResidentDropdown = signal(false);

  back() {
    this.router.navigate(['/dashboard/houses']);
  }

  selectResident(id: string) {
    this.selectedResidentId.set(id);
    this.showResidentDropdown.set(false);
  }

  clearResident() {
    this.selectedResidentId.set('');
    this.residentSearchQuery.set('');
  }

  submit() {
    if (!this.selectedBlock() || !this.selectedFloor() || !this.unit()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.houseService.addHouse({
      block: this.selectedBlock(),
      floor: this.selectedFloor(),
      unit: this.unit(),
      status: this.selectedResidentId() ? HouseStatus.Occupied : HouseStatus.Vacant,
      residentId: this.selectedResidentId() || undefined
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard/houses']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Échec de l\'ajout de la maison. Veuillez réessayer.');
        console.error('Add house error:', err);
      }
    });
  }
}
