import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RappelServices } from './rappel-services';
import { RappelDto, RappelStatus, CreateRappelDto, UpdateRappelDto } from './rappel-model';
import { HouseServices, HouseFinancialStatementDto } from '../houses/house-services';
import { HouseModel } from '../houses/house-model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../login/login-service';
import { UserRole } from '../users/user-model';

@Component({
  selector: 'app-rappels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rappels.html',
  styleUrl: './rappels.css'
})
export class Rappels implements OnInit {
  rappelService = inject(RappelServices);
  houseService = inject(HouseServices);
  toastr = inject(ToastrService);
  loginService = inject(LoginService);

  // Data
  rappels = signal<RappelDto[]>([]);
  houses = signal<HouseModel[]>([]);
  isLoading = signal(false);
  isResident = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  // Filter
  filterStatus = signal<'all' | 'paid' | 'unpaid'>('all');

  // Create modal
  showCreateModal = signal(false);
  createHouseId = signal('');
  createAmount = signal(0);
  createNotes = signal('');
  isSaving = signal(false);
  
  // Financial Statement context
  houseFinancialStatement = signal<HouseFinancialStatementDto | null>(null);
  isLoadingFinancialStatement = signal(false);

  // Edit modal
  showEditModal = signal(false);
  editRappel = signal<RappelDto | null>(null);
  editAmount = signal(0);
  editNotes = signal('');
  editStatus = signal<RappelStatus>(RappelStatus.Unpaid);

  // Delete confirm
  showDeleteConfirm = signal(false);
  deleteTarget = signal<RappelDto | null>(null);

  // Expose enum
  RappelStatus = RappelStatus;

  // Computed stats
  totalUnpaid = computed(() => {
    return this.rappels()
      .filter(r => r.status === RappelStatus.Unpaid)
      .reduce((sum, r) => sum + r.amount, 0);
  });

  unpaidCount = computed(() => {
    return this.rappels().filter(r => r.status === RappelStatus.Unpaid).length;
  });

  paidCount = computed(() => {
    return this.rappels().filter(r => r.status === RappelStatus.Paid).length;
  });

  filteredRappels = computed(() => {
    const status = this.filterStatus();
    const all = this.rappels();
    if (status === 'paid') return all.filter(r => r.status === RappelStatus.Paid);
    if (status === 'unpaid') return all.filter(r => r.status === RappelStatus.Unpaid);
    return all;
  });

  ngOnInit() {
    const userRole = this.loginService.getCurrentUser()?.role;
    this.isResident.set(Number(userRole) === UserRole.Resident);

    this.loadRappels();
    this.loadHouses();
  }

  loadRappels() {
    this.isLoading.set(true);
    const user = this.loginService.getCurrentUser();
    const residentHouseId = user?.resident?.houseId || user?.houseId;

    if (this.isResident() && residentHouseId) {
      this.rappelService.loadRappelsByHouse(residentHouseId, this.currentPage(), this.pageSize()).subscribe({
        next: (result) => {
          this.rappels.set(result.items);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.toastr.error('Erreur lors du chargement des rappels');
        }
      });
    } else {
      this.rappelService.loadRappels(this.currentPage(), this.pageSize()).subscribe({
        next: (result) => {
          this.rappels.set(result.items);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.toastr.error('Erreur lors du chargement des rappels');
        }
      });
    }
  }

  loadHouses() {
    this.houseService.loadHouses(1, 200).subscribe({
      next: (result) => {
        this.houses.set(result.items.map(dto => ({
          id: dto.id,
          block: dto.block,
          unit: dto.unit,
          floor: dto.floor || '',
          status: dto.status,
          residentId: dto.currentResidentId
        })));
      },
      error: () => { }
    });
  }

  getHouseLabel(houseId: string): string {
    const h = this.houses().find(x => x.id === houseId);
    return h ? `${h.block}, Unité ${h.unit}` : houseId.substring(0, 8) + '…';
  }

  // ── Create ────────────────────────────────────────

  openCreate() {
    this.createHouseId.set('');
    this.createAmount.set(0);
    this.createNotes.set('');
    this.houseFinancialStatement.set(null);
    this.showCreateModal.set(true);
  }

  closeCreate() {
    this.showCreateModal.set(false);
  }

  onHouseSelectionChange(houseId: string) {
    this.createHouseId.set(houseId);
    this.houseFinancialStatement.set(null);
    if (!houseId) {
      this.createAmount.set(0);
      return;
    }

    this.isLoadingFinancialStatement.set(true);
    this.houseService.getHouseFinancialStatement(houseId).subscribe({
      next: (stmt) => {
        this.houseFinancialStatement.set(stmt);
        // Automatically suggest the total rappel to pay as the amount
        this.createAmount.set(stmt.totalRappelToPay);
        this.isLoadingFinancialStatement.set(false);
      },
      error: () => {
        this.isLoadingFinancialStatement.set(false);
        this.toastr.error('Impossible de charger le bilan financier de la maison.');
      }
    });
  }

  saveCreate() {
    if (!this.createHouseId() || this.createAmount() <= 0) return;

    this.isSaving.set(true);
    const dto: CreateRappelDto = {
      houseId: this.createHouseId(),
      amount: this.createAmount(),
      notes: this.createNotes() || undefined
    };

    this.rappelService.createRappel(dto).subscribe({
      next: () => {
        this.toastr.success('Rappel créé avec succès');
        this.isSaving.set(false);
        this.closeCreate();
        this.loadRappels();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastr.error('Erreur lors de la création du rappel');
      }
    });
  }

  // ── Edit ────────────────────────────────────────

  openEdit(rappel: RappelDto) {
    this.editRappel.set(rappel);
    this.editAmount.set(rappel.amount);
    this.editNotes.set(rappel.notes || '');
    this.editStatus.set(rappel.status);
    this.showEditModal.set(true);
  }

  closeEdit() {
    this.showEditModal.set(false);
    this.editRappel.set(null);
  }

  saveEdit() {
    const rappel = this.editRappel();
    if (!rappel) return;

    this.isSaving.set(true);
    const dto: UpdateRappelDto = {
      amount: this.editAmount(),
      notes: this.editNotes() || undefined,
      status: this.editStatus()
    };

    this.rappelService.updateRappel(rappel.id, dto).subscribe({
      next: () => {
        this.toastr.success('Rappel mis à jour');
        this.isSaving.set(false);
        this.closeEdit();
        this.loadRappels();
      },
      error: () => {
        this.isSaving.set(false);
        this.toastr.error('Erreur lors de la mise à jour');
      }
    });
  }

  // ── Quick mark as paid ────────────────────────────

  markAsPaid(rappel: RappelDto) {
    this.rappelService.updateRappel(rappel.id, { status: RappelStatus.Paid }).subscribe({
      next: () => {
        this.toastr.success('Rappel marqué comme payé');
        this.loadRappels();
      },
      error: () => {
        this.toastr.error('Erreur lors de la mise à jour');
      }
    });
  }

  // ── Delete ────────────────────────────────────────

  confirmDelete(rappel: RappelDto) {
    this.deleteTarget.set(rappel);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  executeDelete() {
    const rappel = this.deleteTarget();
    if (!rappel) return;

    this.rappelService.deleteRappel(rappel.id).subscribe({
      next: () => {
        this.toastr.success('Rappel supprimé');
        this.cancelDelete();
        this.loadRappels();
      },
      error: () => {
        this.toastr.error('Erreur lors de la suppression');
      }
    });
  }

  // ── Pagination ────────────────────────────────────

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadRappels();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadRappels();
    }
  }

  // ── Helpers ────────────────────────────────────────

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  }
}
