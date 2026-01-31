import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepenseServices } from './depense-services';
import { DepenseModel, DEPENSE_TYPES, DepenseType } from './depense-model';

@Component({
  selector: 'app-depenses',
  imports: [CommonModule, FormsModule],
  templateUrl: './depenses.html',
  styleUrl: './depenses.css',
})
export class Depenses {
  depenseService = inject(DepenseServices);

  // Signals
  depenses = signal<DepenseModel[]>([]);
  searchQuery = signal('');
  typeFilter = signal<string>('Tous les types');
  currentPage = signal(1);
  pageSize = signal(5);

  // Form signals
  showAddForm = signal(false);
  editingId = signal<string | null>(null);

  // Form fields
  formTitre = signal('');
  formType = signal<DepenseType>('Maintenance');
  formMontant = signal<number>(0);
  formDate = signal('');
  formDescription = signal('');
  formImages = signal<string[]>([]);
  newImageUrl = signal('');

  // Image viewer
  viewingImage = signal<string | null>(null);

  depenseTypes = DEPENSE_TYPES;

  constructor() {
    this.depenseService.depenses$.subscribe(data => {
      this.depenses.set(data);
    });
  }

  // Computed
  filteredDepenses = computed(() => {
    let result = this.depenses();
    const query = this.searchQuery().toLowerCase();
    const type = this.typeFilter();

    if (type !== 'Tous les types') {
      result = result.filter(d => d.type === type);
    }

    if (query) {
      result = result.filter(d =>
        d.titre.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query)
      );
    }
    return result;
  });

  totalItems = computed(() => this.filteredDepenses().length);

  paginatedDepenses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredDepenses().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  totalDepenses = computed(() => this.depenses().reduce((sum, d) => sum + d.montant, 0));
  depensesThisMonth = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return this.depenses()
      .filter(d => {
        const depenseDate = new Date(d.date);
        return depenseDate.getMonth() === currentMonth && depenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + d.montant, 0);
  });

  showingRangeStart = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);
  showingRangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  // Actions
  openAddForm() {
    this.resetForm();
    this.showAddForm.set(true);
    this.editingId.set(null);
  }

  closeForm() {
    this.showAddForm.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm() {
    this.formTitre.set('');
    this.formType.set('Maintenance');
    this.formMontant.set(0);
    this.formDate.set(new Date().toISOString().split('T')[0]);
    this.formDescription.set('');
    this.formImages.set([]);
    this.newImageUrl.set('');
  }

  addImageUrl() {
    const url = this.newImageUrl().trim();
    if (url && !this.formImages().includes(url)) {
      this.formImages.set([...this.formImages(), url]);
      this.newImageUrl.set('');
    }
  }

  removeImage(index: number) {
    const images = [...this.formImages()];
    images.splice(index, 1);
    this.formImages.set(images);
  }

  saveDepense() {
    if (!this.formTitre().trim() || !this.formDate() || this.formMontant() <= 0) {
      return;
    }

    const request = {
      titre: this.formTitre().trim(),
      type: this.formType(),
      montant: this.formMontant(),
      date: this.formDate(),
      description: this.formDescription().trim(),
      images: this.formImages()
    };

    if (this.editingId()) {
      this.depenseService.updateDepense(this.editingId()!, request);
    } else {
      this.depenseService.addDepense(request);
    }

    this.closeForm();
  }

  editDepense(depense: DepenseModel) {
    this.formTitre.set(depense.titre);
    this.formType.set(depense.type);
    this.formMontant.set(depense.montant);
    this.formDate.set(depense.date);
    this.formDescription.set(depense.description);
    this.formImages.set([...depense.images]);
    this.editingId.set(depense.id);
    this.showAddForm.set(true);
  }

  deleteDepense(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      this.depenseService.deleteDepense(id);
    }
  }

  viewImage(url: string) {
    this.viewingImage.set(url);
  }

  closeImageViewer() {
    this.viewingImage.set(null);
  }

  updateSearch(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  updateTypeFilter(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    this.typeFilter.set(value);
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
  }

  getTypeIcon(type: DepenseType): string {
    const icons: Record<DepenseType, string> = {
      'Maintenance': 'build',
      'Électricité': 'bolt',
      'Eau': 'water_drop',
      'Nettoyage': 'cleaning_services',
      'Sécurité': 'security',
      'Jardinage': 'park',
      'Réparations': 'handyman',
      'Équipements': 'fitness_center',
      'Assurance': 'shield',
      'Taxes': 'receipt_long',
      'Autre': 'more_horiz'
    };
    return icons[type] || 'receipt';
  }

  getTypeColor(type: DepenseType): string {
    const colors: Record<DepenseType, string> = {
      'Maintenance': 'bg-blue-100 text-blue-600',
      'Électricité': 'bg-yellow-100 text-yellow-600',
      'Eau': 'bg-cyan-100 text-cyan-600',
      'Nettoyage': 'bg-green-100 text-green-600',
      'Sécurité': 'bg-purple-100 text-purple-600',
      'Jardinage': 'bg-emerald-100 text-emerald-600',
      'Réparations': 'bg-orange-100 text-orange-600',
      'Équipements': 'bg-pink-100 text-pink-600',
      'Assurance': 'bg-indigo-100 text-indigo-600',
      'Taxes': 'bg-red-100 text-red-600',
      'Autre': 'bg-gray-100 text-gray-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  }
}
