import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentServices } from './incident-services';
import { IncidentModel, IncidentStatus } from './incident-model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-incidents',
  imports: [CommonModule, FormsModule],
  templateUrl: './incidents.html',
  styleUrl: './incidents.css',
})
export class Incidents implements OnInit {
  router = inject(Router);
  incidentService = inject(IncidentServices);

  // Signals
  incidents = signal<IncidentModel[]>([]);
  loading = toSignal(this.incidentService.loading$, { initialValue: false });
  searchQuery = signal('');
  statusFilter = signal<string>('All Status');
  currentPage = signal(1);
  pageSize = signal(10);
  IncidentStatus = IncidentStatus;

  getCategoryLabel(category: number): string {
    const labels: { [key: number]: string } = {
      0: 'Plomberie',
      1: 'Électricité',
      2: 'Sécurité',
      3: 'Climatisation / Chauffage',
      4: 'Ascenseur',
      5: 'Autre'
    };
    return labels[category] || 'Inconnu';
  }

  getStatusLabel(status: number): string {
    const labels: { [key: number]: string } = {
      0: 'Ouvert',
      1: 'En cours',
      2: 'Résolu',
      3: 'Fermé'
    };
    return labels[status] || 'Inconnu';
  }

  constructor() {
    this.incidentService.incidents$.subscribe(data => {
      this.incidents.set(data);
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.incidentService.loadIncidents(this.currentPage(), this.pageSize()).subscribe();
  }

  // Computed
  filteredIncidents = computed(() => {
    let result = this.incidents();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    if (status !== 'All Status') {
      result = result.filter(i => i.status.toString() === status);
    }

    if (query) {
      result = result.filter(i =>
        (i.residentName?.toLowerCase().includes(query) || false) ||
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query)
      );
    }
    return result;
  });

  totalItems = computed(() => this.filteredIncidents().length);

  paginatedIncidents = computed(() => {
    // Current backend returns a slice, but for local filtering we might still need this
    // If we transition fully to server-side filtering, this would just return filteredIncidents()
    return this.filteredIncidents();
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // Derived counts
  openCount = computed(() => this.incidents().filter(i => i.status === IncidentStatus.Open).length);
  inProgressCount = computed(() => this.incidents().filter(i => i.status === IncidentStatus.InProgress).length);
  resolvedCount = computed(() => this.incidents().filter(i => i.status === IncidentStatus.Resolved).length);

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
    // For now we just increment local page, but ideally call API
    this.currentPage.update(p => p + 1);
    this.loadData();
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  setPageSize(size: string) {
    this.pageSize.set(parseInt(size, 10));
    this.currentPage.set(1);
    this.loadData();
  }
}
