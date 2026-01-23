import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ResidentModel } from './resident-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResidentServices } from './resident-services';
import { inject } from '@angular/core';

@Component({
  selector: 'app-residents',
  imports: [CommonModule, FormsModule],
  templateUrl: './residents.html',
  styleUrl: './residents.css',
})
export class Residents {

  pageSizes = signal([5, 10, 25, 50]);
  page = signal(1);
  pageSize = signal(5);
  searchQuery = signal("");

  statuses = signal(['Active', 'Inactive']);
  blocks = signal(['Block A', 'Block B', 'Block C']);

  selectedStatus = signal('');
  selectedBlock = signal('');
  residentServices = inject(ResidentServices);
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

  addResident() {
    this.router.navigate(['residents/add']);
  }
  goToResidentDetails() {
    this.router.navigate(['dashboard/resident-details']);
  }

  residents = toSignal(this.residentServices.residents$, { initialValue: [] });

  paginatedResidents = computed(() => {
    let filteredResidents = this.residents();
    if (this.searchQuery()) {
      filteredResidents = this.residents().filter(resident => resident.firstName.toLowerCase().includes(this.searchQuery().toLowerCase())
        || resident.lastName.toLowerCase().includes(this.searchQuery().toLowerCase())
        || resident.House.toLowerCase().includes(this.searchQuery().toLowerCase()));
    }

    if (this.selectedStatus()) {
      filteredResidents = filteredResidents.filter(resident => resident.status === this.selectedStatus());
    }
    if (this.selectedBlock()) {
      filteredResidents = filteredResidents.filter(resident => resident.block === this.selectedBlock());
    }
    if (this.pageSize()) {
      const startIndex = (this.page() - 1) * this.pageSize();
      filteredResidents = filteredResidents.slice(startIndex, startIndex + this.pageSize());
    }
    return filteredResidents;
  });

  getAvatarColor(resident: ResidentModel): string {
    const colors = [
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
      'bg-teal-100 text-teal-700',
      'bg-indigo-100 text-indigo-700'
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
