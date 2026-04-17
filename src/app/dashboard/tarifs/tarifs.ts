import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TarifService } from './tarif-service';
import { TarifDto, TarifHistoryDto, CreateTarifDto, UpdateTarifDto, UpdateTarifHistoryDto } from './tarif-model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../login/login-service';
import { UserRole } from '../users/user-model';

@Component({
  selector: 'app-tarifs',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './tarifs.html',
  styleUrl: './tarifs.css'
})
export class Tarifs implements OnInit {
  residenceId = environment.residenceId;
  loginService = inject(LoginService);

  // State
  currentTarif = signal<TarifDto | null>(null);
  tarifHistory = signal<TarifHistoryDto[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isResident = signal<boolean>(false);

  // Modal state — tarif create/update
  showForm = signal<boolean>(false);
  formMode = signal<'create' | 'update'>('create');

  // Form fields — tarif
  formDescription = signal<string>('');
  formAmount = signal<number>(0);
  formCurrency = signal<string>('DTN');
  formEffectiveDate = signal<string>('');
  formChangeReason = signal<string>('');

  // Modal state — history edit
  showHistoryForm = signal<boolean>(false);
  selectedHistory = signal<TarifHistoryDto | null>(null);
  isSavingHistory = signal<boolean>(false);

  // Form fields — history edit
  histPreviousAmount = signal<number>(0);
  histNewAmount = signal<number>(0);
  histPreviousDescription = signal<string>('');
  histNewDescription = signal<string>('');
  histEffectiveDate = signal<string>('');
  histChangeReason = signal<string>('');

  constructor(
    private tarifService: TarifService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    const userRole = this.loginService.getCurrentUser()?.role;
    this.isResident.set(Number(userRole) === UserRole.Resident);

    this.loadCurrentTarif();
  }

  loadCurrentTarif() {
    this.isLoading.set(true);
    this.tarifService.getCurrentTarif(this.residenceId).subscribe({
      next: (tarif) => {
        this.currentTarif.set(tarif);
        this.isLoading.set(false);
        if (tarif && tarif.id) {
          this.loadHistory();
        }
      },
      error: (err) => {
        // If 404, it means no current tarif exists, which is fine
        this.currentTarif.set(null);
        this.tarifHistory.set([]);
        this.isLoading.set(false);
      }
    });
  }

  loadHistory() {
    this.tarifService.getResidenceTarifHistory(this.residenceId).subscribe({
      next: (history) => {
        const sorted = history.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
        this.tarifHistory.set(sorted);
      },
      error: (err) => {
        console.error('Historique non chargé', err);
      }
    });
  }

  /** Returns a YYYY-MM string for the current month (used by month pickers). */
  private currentMonthValue(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  /** Converts a YYYY-MM value to the first day of that month as a Date object. */
  private monthValueToDate(value: string): Date {
    return new Date(`${value}-01T00:00:00`);
  }

  /** Converts a Date object to a YYYY-MM string. */
  private dateToMonthValue(date: Date): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  openCreate() {
    this.formMode.set('create');
    this.formDescription.set('');
    this.formAmount.set(0);
    this.formCurrency.set('DTN');
    this.formEffectiveDate.set(this.currentMonthValue());
    this.formChangeReason.set('');
    this.showForm.set(true);
  }

  openUpdate() {
    const current = this.currentTarif();
    if (!current) return;

    this.formMode.set('update');
    this.formDescription.set(current.description);
    this.formAmount.set(current.amount);
    this.formCurrency.set(current.currency);
    this.formEffectiveDate.set(this.currentMonthValue());
    this.formChangeReason.set('');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  saveTarif() {
    this.isSaving.set(true);

    if (this.formMode() === 'create') {
      const dto: CreateTarifDto = {
        description: this.formDescription(),
        amount: this.formAmount(),
        currency: this.formCurrency(),
        effectiveDate: this.monthValueToDate(this.formEffectiveDate())
      };

      this.tarifService.createTarif(this.residenceId, dto).subscribe({
        next: (tarif) => {
          this.toastr.success('Tarif créé avec succès');
          this.closeForm();
          this.isSaving.set(false);
          this.currentTarif.set(tarif);
          this.loadHistory();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toastr.error('Erreur lors de la création du tarif');
        }
      });
    } else {
      const current = this.currentTarif();
      if (!current) return;

      const dto: UpdateTarifDto = {
        description: this.formDescription(),
        amount: this.formAmount(),
        currency: this.formCurrency(),
        effectiveDate: this.monthValueToDate(this.formEffectiveDate()),
        changeReason: this.formChangeReason()
      };

      this.tarifService.updateTarif(this.residenceId, current.id, dto).subscribe({
        next: (tarif) => {
          this.toastr.success('Tarif mis à jour avec succès');
          this.closeForm();
          this.isSaving.set(false);
          this.currentTarif.set(tarif);
          this.loadHistory();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toastr.error('Erreur lors de la mise à jour du tarif');
        }
      });
    }
  }

  formatCurrency(amount: number, currency: string = 'DTN'): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency === 'DTN' ? 'TND' : currency
    }).format(amount);
  }

  // ── History edit ────────────────────────────────────────────

  openEditHistory(history: TarifHistoryDto) {
    this.selectedHistory.set(history);
    this.histPreviousAmount.set(history.previousAmount);
    this.histNewAmount.set(history.newAmount);
    this.histPreviousDescription.set(history.previousDescription || '');
    this.histNewDescription.set(history.newDescription || '');
    this.histEffectiveDate.set(this.dateToMonthValue(new Date(history.effectiveDate)));
    this.histChangeReason.set(history.changeReason || '');
    this.showHistoryForm.set(true);
  }

  closeHistoryForm() {
    this.showHistoryForm.set(false);
    this.selectedHistory.set(null);
  }

  saveHistoryEdit() {
    const history = this.selectedHistory();
    const tarif = this.currentTarif();
    if (!history || !tarif) return;

    this.isSavingHistory.set(true);

    const dto: UpdateTarifHistoryDto = {
      previousAmount: this.histPreviousAmount(),
      newAmount: this.histNewAmount(),
      previousDescription: this.histPreviousDescription(),
      newDescription: this.histNewDescription(),
      effectiveDate: this.monthValueToDate(this.histEffectiveDate()),
      changeReason: this.histChangeReason()
    };

    this.tarifService.updateTarifHistory(this.residenceId, tarif.id, history.id, dto).subscribe({
      next: (updated) => {
        // Patch the local list in-place
        this.tarifHistory.update(list =>
          list.map(h => h.id === updated.id ? updated : h)
        );
        this.toastr.success('Historique corrigé avec succès');
        this.isSavingHistory.set(false);
        this.closeHistoryForm();
      },
      error: (err) => {
        this.isSavingHistory.set(false);
        const msg = err?.message || 'Erreur lors de la correction';
        this.toastr.error(msg);
      }
    });
  }
}
