import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DepenseServices } from './depense-services';
import {
  DepenseModel,
  DEPENSE_TYPES,
  EXPENSE_TYPE_LABELS,
  ExpenseType,
  CreateExpenseDto,
  UpdateExpenseDto
} from './depense-model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-depenses',
  imports: [CommonModule, FormsModule],
  templateUrl: './depenses.html',
  styleUrl: './depenses.css',
})
export class Depenses implements OnInit, OnDestroy {
  depenseService = inject(DepenseServices);

  private destroy$ = new Subject<void>();
  private residenceId = environment.residenceId;

  // Data state
  depenses = signal<DepenseModel[]>([]);
  loading = toSignal(this.depenseService.loading$, { initialValue: false });
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Filters & pagination (client-side on current page data)
  searchQuery = signal('');
  typeFilter = signal<string>('all');
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  // Form state
  showAddForm = signal(false);
  editingId = signal<string | null>(null);
  isSaving = signal(false);

  // Form fields
  formTitle = signal('');
  formType = signal<ExpenseType>(ExpenseType.Maintenance);
  formAmount = signal<number>(0);
  formDate = signal('');
  formDescription = signal('');

  // Image management on edit
  formImageUrl = signal('');
  pendingImageUrls = signal<string[]>([]);  // URLs to add after save

  // Image viewer
  viewingImage = signal<string | null>(null);

  // Expose enum/label helpers to template
  depenseTypes = DEPENSE_TYPES;
  ExpenseType = ExpenseType;
  getTypeLabel = (type: ExpenseType) => EXPENSE_TYPE_LABELS[type] ?? 'Autre';

  ngOnInit(): void {
    this.loadDepenses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────

  loadDepenses(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.depenseService
      .getExpensesByResidence(this.residenceId, {
        pageNumber: this.currentPage(),
        pageSize: this.pageSize()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.depenses.set(response.items);
          this.totalCount.set(response.totalCount);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading expenses:', err);
          this.errorMessage.set('Impossible de charger les dépenses. Veuillez réessayer.');
          this.isLoading.set(false);
        }
      });

    // Load KPIs for the header stats
    this.depenseService.getTotalExpenseKpi(this.residenceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kpi) => this.totalDepenses.set(kpi.totalAmount),
        error: (err) => console.error('Error loading total KPI:', err)
      });

    this.depenseService.getMonthlyExpenses(this.residenceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (monthly) => {
          const now = new Date();
          const currentMonthData = monthly.data.find(d => d.year === now.getFullYear() && d.month === now.getMonth() + 1);
          this.depensesThisMonth.set(currentMonthData ? currentMonthData.totalAmount : 0);
        },
        error: (err) => console.error('Error loading monthly KPI:', err)
      });
  }

  // ── Computed helpers ──────────────────────────────────────

  filteredDepenses = computed(() => {
    let result = this.depenses();
    const query = this.searchQuery().toLowerCase();
    const typeVal = this.typeFilter();

    if (typeVal !== 'all') {
      result = result.filter(d => d.type === +typeVal);
    }

    if (query) {
      result = result.filter(d =>
        d.title.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        this.getTypeLabel(d.type).toLowerCase().includes(query)
      );
    }
    return result;
  });

  totalDepenses = signal<number>(0);
  depensesThisMonth = signal<number>(0);

  showingRangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
  );
  showingRangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalCount())
  );

  // ── Form actions ──────────────────────────────────────────

  openAddForm(): void {
    this.resetForm();
    this.editingId.set(null);
    this.showAddForm.set(true);
  }

  closeForm(): void {
    this.showAddForm.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.formTitle.set('');
    this.formType.set(ExpenseType.Maintenance);
    this.formAmount.set(0);
    this.formDate.set(new Date().toISOString().split('T')[0]);
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.pendingImageUrls.set([]);
  }

  editDepense(depense: DepenseModel): void {
    this.formTitle.set(depense.title);
    this.formType.set(depense.type);
    this.formAmount.set(depense.amount);
    this.formDate.set(new Date(depense.expenseDate).toISOString().split('T')[0]);
    this.formDescription.set(depense.description);
    this.pendingImageUrls.set([]);
    this.editingId.set(depense.id);
    this.showAddForm.set(true);
  }

  saveDepense(): void {
    if (!this.formTitle().trim() || !this.formDate() || this.formAmount() <= 0) return;

    this.isSaving.set(true);
    const id = this.editingId();

    if (id) {
      // UPDATE
      const dto: UpdateExpenseDto = {
        title: this.formTitle().trim(),
        type: this.formType(),
        amount: this.formAmount(),
        expenseDate: this.formDate(),
        description: this.formDescription().trim()
      };

      this.depenseService.updateExpense(this.residenceId, id, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.closeForm();
            this.loadDepenses();
          },
          error: (err) => {
            console.error('Error updating expense:', err);
            this.errorMessage.set('Erreur lors de la mise à jour. Veuillez réessayer.');
            this.isSaving.set(false);
          }
        });
    } else {
      // CREATE
      const dto: CreateExpenseDto = {
        title: this.formTitle().trim(),
        type: this.formType(),
        amount: this.formAmount(),
        expenseDate: this.formDate(),
        description: this.formDescription().trim()
      };

      this.depenseService.createExpense(this.residenceId, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (created) => {
            // Add pending images sequentially
            const urls = this.pendingImageUrls();
            if (urls.length > 0) {
              urls.forEach(url => {
                this.depenseService.addImageToExpense(
                  this.residenceId,
                  created.id,
                  { expenseId: created.id, imageUrl: url }
                ).subscribe();
              });
            }
            this.isSaving.set(false);
            this.closeForm();
            this.loadDepenses();
          },
          error: (err) => {
            console.error('Error creating expense:', err);
            this.errorMessage.set('Erreur lors de la création. Veuillez réessayer.');
            this.isSaving.set(false);
          }
        });
    }
  }

  deleteDepense(depense: DepenseModel): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${depense.title}" ?`)) {
      this.depenseService.deleteExpense(this.residenceId, depense.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // If we deleted the only item on a page > 1, go back
            if (this.filteredDepenses().length === 1 && this.currentPage() > 1) {
              this.currentPage.update(p => p - 1);
            }
            this.loadDepenses();
          },
          error: (err) => {
            console.error('Error deleting expense:', err);
            this.errorMessage.set('Erreur lors de la suppression. Veuillez réessayer.');
          }
        });
    }
  }

  removeExpenseImage(depense: DepenseModel, imageId: string): void {
    this.depenseService.removeImageFromExpense(this.residenceId, imageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadDepenses(),
        error: (err) => console.error('Error removing image:', err)
      });
  }

  // ── Image form helpers ────────────────────────────────────

  addPendingImage(): void {
    const url = this.formImageUrl().trim();
    if (url && !this.pendingImageUrls().includes(url)) {
      this.pendingImageUrls.set([...this.pendingImageUrls(), url]);
      this.formImageUrl.set('');
    }
  }

  removePendingImage(index: number): void {
    const imgs = [...this.pendingImageUrls()];
    imgs.splice(index, 1);
    this.pendingImageUrls.set(imgs);
  }

  // ── Filters / pagination ──────────────────────────────────

  updateSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  updateTypeFilter(e: Event): void {
    this.typeFilter.set((e.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadDepenses();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadDepenses();
    }
  }

  setPageSize(size: string): void {
    this.pageSize.set(parseInt(size, 10));
    this.currentPage.set(1);
    this.loadDepenses();
  }

  // ── Image viewer ─────────────────────────────────────────

  viewImage(url: string): void {
    this.viewingImage.set(url);
  }

  closeImageViewer(): void {
    this.viewingImage.set(null);
  }

  dismissError(): void {
    this.errorMessage.set(null);
  }

  // ── Formatting helpers ────────────────────────────────────

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DTN' }).format(amount);
  }

  getTypeIcon(type: ExpenseType): string {
    const icons: Record<ExpenseType, string> = {
      [ExpenseType.Maintenance]: 'build',
      [ExpenseType.Electricity]: 'bolt',
      [ExpenseType.Water]: 'water_drop',
      [ExpenseType.Cleaning]: 'cleaning_services',
      [ExpenseType.Security]: 'security',
      [ExpenseType.Gardening]: 'park',
      [ExpenseType.Repairs]: 'handyman',
      [ExpenseType.Equipment]: 'fitness_center',
      [ExpenseType.Insurance]: 'shield',
      [ExpenseType.Taxes]: 'receipt_long',
      [ExpenseType.Other]: 'more_horiz'
    };
    return icons[type] ?? 'receipt';
  }

  getTypeColor(type: ExpenseType): string {
    const colors: Record<ExpenseType, string> = {
      [ExpenseType.Maintenance]: 'bg-blue-100 text-blue-600',
      [ExpenseType.Electricity]: 'bg-yellow-100 text-yellow-600',
      [ExpenseType.Water]: 'bg-cyan-100 text-cyan-600',
      [ExpenseType.Cleaning]: 'bg-green-100 text-green-600',
      [ExpenseType.Security]: 'bg-purple-100 text-purple-600',
      [ExpenseType.Gardening]: 'bg-emerald-100 text-emerald-600',
      [ExpenseType.Repairs]: 'bg-orange-100 text-orange-600',
      [ExpenseType.Equipment]: 'bg-pink-100 text-pink-600',
      [ExpenseType.Insurance]: 'bg-indigo-100 text-indigo-600',
      [ExpenseType.Taxes]: 'bg-red-100 text-red-600',
      [ExpenseType.Other]: 'bg-gray-100 text-gray-600'
    };
    return colors[type] ?? 'bg-gray-100 text-gray-600';
  }
}
