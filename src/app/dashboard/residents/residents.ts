import { Component, computed, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ResidentModel } from './resident-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResidentServices } from './resident-services';
import { inject } from '@angular/core';
import { HouseServices } from '../houses/house-services';

@Component({
  selector: 'app-residents',
  imports: [CommonModule, FormsModule],
  templateUrl: './residents.html',
  styleUrl: './residents.css',
})
export class Residents implements OnInit {

  residentServices = inject(ResidentServices);
  houseServices = inject(HouseServices);
  residents = toSignal(this.residentServices.residents$, { initialValue: [] });

  pageSizes = signal([5, 10, 25, 50]);
  page = signal(1);
  pageSize = signal(5);
  searchQuery = signal("");

  houses = toSignal(this.houseServices.houses$, { initialValue: [] });

  GetHouseName(id: string) {
    var house = this.houses().find(h => h.id === id);
    return house?.block + " " + house?.floor + "-" + house?.unit;
  }
  statuses = computed(() => [...new Set(this.residents().map(r => r.status))].sort());

  selectedStatus = signal('');
  selectedBlock = signal('');
  onStatusChange(selectedStatus: string) {
    this.selectedStatus.set(selectedStatus);
  }
  onBlockChange(selectedBlock: string) {
    this.selectedBlock.set(selectedBlock);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.selectedBlock.set('');
  }
  constructor(private router: Router) { }

  ngOnInit() {

    this.residentServices.loadResidents(1, 100).subscribe({
      error: (err) => console.error('Failed to load residents:', err)
    });
  }

  addResident() {
    this.router.navigate(['residents/add']);
  }
  goToResidentDetails(id: string) {
    this.router.navigate(['/dashboard/resident-details', id]);
  }



  paginatedResidents = computed(() => {
    let filteredResidents = this.residents();
    if (this.searchQuery()) {
      filteredResidents = this.residents().filter(resident => resident.firstName.toLowerCase().includes(this.searchQuery().toLowerCase())
        || resident.lastName.toLowerCase().includes(this.searchQuery().toLowerCase()));
    }

    if (this.selectedStatus()) {
      filteredResidents = filteredResidents.filter(resident => resident.status === this.selectedStatus());
    }

    if (this.pageSize()) {
      const startIndex = (this.page() - 1) * this.pageSize();
      filteredResidents = filteredResidents.slice(startIndex, startIndex + this.pageSize());
    }
    return filteredResidents;
  });

  getAvatarColor(resident: ResidentModel): string {
    const colors = [
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-violet-500',
      'bg-cyan-500',
      'bg-orange-500',
      'bg-blue-500'
    ];
    // Simple hash function to get consistent index from ID
    let hash = 0;
    for (let i = 0; i < resident.id.length; i++) {
      hash = resident.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  goNextPage() {
    this.page.update(p => p + 1);
  }

  goPreviousPage() {
    this.page.update(p => p - 1);
  }

  SetPageSize(pageSize: any) {
    this.pageSize.set(Number(pageSize));
    this.page.set(1);
  }
  editResident(id: string) {
    this.router.navigate(['residents/add', id]);
  }
}
