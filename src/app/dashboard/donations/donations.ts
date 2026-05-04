import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DonationService } from '../../services/donation.service';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import {
    DonationDto,
    DonationDetailDto,
    CreateDonationDto,
    UpdateDonationDto,
    DonationSummary
} from '../../models/donation.model';

@Component({
    selector: 'app-donations',
    imports: [CommonModule, FormsModule],
    templateUrl: './donations.html',
    styleUrl: './donations.css'
})
export class Donations implements OnInit {
    donationService = inject(DonationService);
    houseService = inject(HouseServices);
    residentService = inject(ResidentServices);

    // State
    donations = signal<DonationDto[]>([]);
    loading = toSignal(this.donationService.loading$, { initialValue: false });
    searchQuery = signal('');
    
    // Lists for dropdowns
    houses = toSignal(this.houseService.houses$, { initialValue: [] });
    residents = toSignal(this.residentService.residents$, { initialValue: [] });

    // Modals
    showCreateModal = signal(false);
    showEditModal = signal(false);
    showDeleteConfirm = signal(false);
    showDetailModal = signal(false);
    isSaving = signal(false);

    // Selected
    selectedDonation = signal<DonationDto | null>(null);
    detailDonation = signal<DonationDetailDto | null>(null);
    deleteTarget = signal<DonationDto | null>(null);
    loadingDetail = signal(false);

    // Create form
    createForm = signal<CreateDonationDto>({
        amount: 0,
        donationDate: new Date().toISOString().split('T')[0],
        description: '',
        houseId: '',
        donorId: ''
    });

    // Edit form
    editForm = signal<UpdateDonationDto>({
        amount: 0,
        donationDate: '',
        description: '',
        houseId: '',
        donorId: ''
    });

    // Pagination
    currentPage = signal(1);
    pageSize = signal(10);

    constructor() {
        this.donationService.donations$.subscribe(data => this.donations.set(data));
    }

    ngOnInit() {
        this.loadData();
        this.houseService.loadHouses(1, 200).subscribe();
        this.residentService.loadResidents(1, 200).subscribe();
    }

    loadData() {
        this.donationService.getAllDonations().subscribe();
    }

    // ─── Computed ───────────────────────────────────────────
    filteredDonations = computed(() => {
        let result = this.donations();
        const q = this.searchQuery().toLowerCase();

        if (q) {
            result = result.filter(d =>
                (d.description ?? '').toLowerCase().includes(q) ||
                (d.houseId ?? '').toLowerCase().includes(q) ||
                (d.donorId ?? '').toLowerCase().includes(q)
            );
        }
        return result;
    });

    totalItems = computed(() => this.filteredDonations().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
    showingRangeStart = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);
    showingRangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

    paginatedDonations = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize();
        return this.filteredDonations().slice(start, start + this.pageSize());
    });

    stats = computed(() => this.donationService.calculateStats(this.donations()));

    // ─── Actions ────────────────────────────────────────────
    updateSearch(e: Event) {
        this.searchQuery.set((e.target as HTMLInputElement).value);
        this.currentPage.set(1);
    }

    nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
    prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }

    // ─── Create ─────────────────────────────────────────────
    openCreate() {
        this.createForm.set({
            amount: 0,
            donationDate: new Date().toISOString().split('T')[0],
            description: '',
            houseId: '',
            donorId: ''
        });
        this.showCreateModal.set(true);
    }

    closeCreate() { this.showCreateModal.set(false); }

    saveCreate() {
        const f = this.createForm();
        if (f.amount <= 0) return;
        
        const payload: any = {
            ...f,
            houseId: f.houseId === '' ? null : f.houseId,
            donorId: f.donorId === '' ? null : f.donorId,
            description: f.description === '' ? null : f.description
        };

        this.isSaving.set(true);
        this.donationService.createDonation(payload).subscribe({
            next: () => { 
                this.isSaving.set(false); 
                this.closeCreate(); 
                this.loadData();
            },
            error: () => this.isSaving.set(false)
        });
    }

    patchCreate(field: string, value: any) {
        this.createForm.update(f => ({ ...f, [field]: value }));
    }

    // ─── Edit ────────────────────────────────────────────────
    openEdit(donation: DonationDto) {
        this.selectedDonation.set(donation);
        this.editForm.set({
            amount: donation.amount,
            donationDate: (donation.donationDate as string).split('T')[0], // format date
            description: donation.description ?? '',
            houseId: donation.houseId ?? '',
            donorId: donation.donorId ?? ''
        });
        this.showEditModal.set(true);
    }

    closeEdit() { this.showEditModal.set(false); this.selectedDonation.set(null); }

    saveEdit() {
        const d = this.selectedDonation();
        if (!d) return;
        
        const f = this.editForm();
        const payload: any = {
            ...f,
            houseId: f.houseId === '' ? null : f.houseId,
            donorId: f.donorId === '' ? null : f.donorId,
            description: f.description === '' ? null : f.description
        };

        this.isSaving.set(true);
        this.donationService.updateDonation(d.id, payload).subscribe({
            next: () => { 
                this.isSaving.set(false); 
                this.closeEdit(); 
                this.loadData();
            },
            error: () => this.isSaving.set(false)
        });
    }

    patchEdit(field: string, value: any) {
        this.editForm.update(f => ({ ...f, [field]: value }));
    }

    // ─── Detail ──────────────────────────────────────────────
    openDetail(donation: DonationDto) {
        this.selectedDonation.set(donation);
        this.loadingDetail.set(true);
        this.showDetailModal.set(true);
        this.donationService.getDonationDetails(donation.id).subscribe({
            next: d => { this.detailDonation.set(d); this.loadingDetail.set(false); },
            error: () => { this.detailDonation.set(null); this.loadingDetail.set(false); }
        });
    }

    closeDetail() {
        this.showDetailModal.set(false);
        this.detailDonation.set(null);
    }

    // ─── Delete ──────────────────────────────────────────────
    confirmDelete(donation: DonationDto) {
        this.deleteTarget.set(donation);
        this.showDeleteConfirm.set(true);
    }

    cancelDelete() { this.showDeleteConfirm.set(false); this.deleteTarget.set(null); }

    executeDelete() {
        const d = this.deleteTarget();
        if (!d) return;
        this.donationService.deleteDonation(d.id).subscribe({
            next: () => {
                this.cancelDelete();
                this.loadData();
            },
            error: () => this.cancelDelete()
        });
    }

    // ─── Helpers ─────────────────────────────────────────────
    getHouseLabel(houseId?: string): string {
        if (!houseId) return 'N/A';
        const house = this.houses().find(h => h.id === houseId);
        return house ? `${house.block} - ${house.unit}` : 'Maison inconnue';
    }

    getDonorLabel(donorId?: string): string {
        if (!donorId) return 'Anonyme';
        const res = this.residents().find(r => r.id === donorId);
        return res ? `${res.firstName} ${res.lastName}` : 'Donateur inconnu';
    }

    formatCurrency(amount: number): string {
        return this.donationService.formatCurrency(amount);
    }
}
