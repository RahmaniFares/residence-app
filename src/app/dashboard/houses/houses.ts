import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HouseServices } from './house-services';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HouseStatus } from './house-model';

@Component({
  selector: 'app-houses',
  imports: [CommonModule, FormsModule],
  templateUrl: './houses.html',
  styleUrl: './houses.css',
})
export class Houses implements OnInit {

  router = inject(Router);
  houseService = inject(HouseServices);

  houses = toSignal(this.houseService.houses$, { initialValue: [] });
  HouseStatus = HouseStatus; // Make enum accessible in template

  searchQuery = signal('');
  selectedStatus = signal<string>(''); // Kept as string for the <select> binding
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
      const statusValue = Number(this.selectedStatus());
      result = result.filter(h => h.status === statusValue);
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

  ngOnInit() {
    // Load houses from backend API
    this.houseService.loadHouses(1, 100).subscribe({
      error: (err) => console.error('Failed to load houses:', err)
    });
  }

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


  showHouseDetails(id: string) {
    this.router.navigate(['dashboard/house-details', id]);
  }

  addHouse() {
    this.router.navigate(['dashboard/add-house']);
  }

  getStatusLabel(status: HouseStatus): string {
    return status === HouseStatus.Occupied ? 'Occupied' : 'Vacant';
  }
}
