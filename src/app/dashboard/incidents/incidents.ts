import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentServices } from './incident-services';
import { IncidentModel } from './incident-model';

@Component({
  selector: 'app-incidents',
  imports: [CommonModule, FormsModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents {
  router = inject(Router);
  incidentService = inject(IncidentServices);

  // Signals
  incidents = signal<IncidentModel[]>([]);
  searchQuery = signal('');
  statusFilter = signal('All Status');
  currentPage = signal(1);
  pageSize = signal(5);

  constructor() {
    this.incidentService.incidents$.subscribe(data => {
      this.incidents.set(data);
    });
  }

  // Computed
  filteredIncidents = computed(() => {
    let result = this.incidents();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    if (status !== 'All Status') {
      result = result.filter(i => i.status === status);
    }

    if (query) {
      result = result.filter(i =>
        i.residentName.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.block.toLowerCase().includes(query) ||
        i.unit.toLowerCase().includes(query)
      );
    }
    return result;
  });

  totalItems = computed(() => this.filteredIncidents().length);

  paginatedIncidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredIncidents().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // Derived counts
  openCount = computed(() => this.incidents().filter(i => i.status === 'Open').length);
  inProgressCount = computed(() => this.incidents().filter(i => i.status === 'In Progress').length);
  resolvedCount = computed(() => this.incidents().filter(i => i.status === 'Resolved').length);

  showingRangeStart = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);
  showingRangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  // Actions
  openIncident(id: string) {
    this.router.navigate(['./dashboard/incident-details', id]);
  }

  addIncident() {
    this.router.navigate(['./dashboard/add-incident']);
  }

  updateSearch(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  updateStatus(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  setPageSize(size: string) {
    this.pageSize.set(parseInt(size, 10));
    this.currentPage.set(1);
  }
}
