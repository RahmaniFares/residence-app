import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HouseServices } from './house-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResidentServices } from '../residents/resident-services';

@Component({
  selector: 'app-houses',
  imports: [CommonModule, FormsModule],
  templateUrl: './houses.html',
  styleUrl: './houses.css',
})
export class Houses {

  router = inject(Router);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices); // To look up resident names if needed

  houses = toSignal(this.houseService.houses$, { initialValue: [] });

  searchQuery = signal('');
  selectedStatus = signal('');
  selectedBlock = signal('');

  blocks = computed(() => [...new Set(this.houses().map(h => h.block))].sort());

  filteredHouses = computed(() => {
    let result = this.houses();

    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      result = result.filter(h =>
        h.unit.toLowerCase().includes(q) ||
        h.block.toLowerCase().includes(q)
      );
    }

    if (this.selectedStatus() && this.selectedStatus() !== 'All Status') {
      result = result.filter(h => h.status === this.selectedStatus());
    }

    if (this.selectedBlock() && this.selectedBlock() !== 'All Blocks') {
      result = result.filter(h => h.block === this.selectedBlock());
    }

    return result;
  });

  page = signal(1);
  pageSize = signal(6);

  paginatedHouses = computed(() => {
    const startIndex = (this.page() - 1) * this.pageSize();
    return this.filteredHouses().slice(startIndex, startIndex + this.pageSize());
  });

  goNextPage() {
    if ((this.page() * this.pageSize()) < this.filteredHouses().length) {
      this.page.update(p => p + 1);
    }
  }

  goPreviousPage() {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
    }
  }


  getResidentName(residentId?: string): string {
    if (!residentId) return 'No resident assigned';
    const resident = this.residentService.getResidentById(residentId);
    return resident ? `${resident.firstName} ${resident.lastName}` : 'Unknown Resident';
  }

  showHouseDetails(id: string) {
    this.router.navigate(['dashboard/house-details', id]);
  }
}
