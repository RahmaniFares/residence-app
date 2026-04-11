import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TarifService } from './tarif-service';
import { TarifDto, TarifHistoryDto, CreateTarifDto, UpdateTarifDto } from './tarif-model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-tarifs',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './tarifs.html',
  styleUrl: './tarifs.css'
})
export class Tarifs implements OnInit {
  residenceId = environment.residenceId;

  // State
  currentTarif = signal<TarifDto | null>(null);
  tarifHistory = signal<TarifHistoryDto[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Modal state
  showForm = signal<boolean>(false);
  formMode = signal<'create' | 'update'>('create');

  // Form fields
  formDescription = signal<string>('');
  formAmount = signal<number>(0);
  formCurrency = signal<string>('DTN');
  formEffectiveDate = signal<string>('');
  formChangeReason = signal<string>('');

  constructor(
    private tarifService: TarifService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
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
        this.tarifHistory.set(history);
      },
      error: (err) => {
        console.error('Historique non chargé', err);
      }
    });
  }

  openCreate() {
    this.formMode.set('create');
    this.formDescription.set('');
    this.formAmount.set(0);
    this.formCurrency.set('DTN');
    const today = new Date().toISOString().split('T')[0];
    this.formEffectiveDate.set(today);
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
    const today = new Date().toISOString().split('T')[0];
    this.formEffectiveDate.set(today);
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
        effectiveDate: new Date(this.formEffectiveDate())
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
}
