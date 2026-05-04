import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmployeeService } from './employee-service';
import { UserServices } from '../users/user-services';
import {
    EmployeeDto,
    EmployeeDetailDto,
    EmployeeStatus,
    EmployeeSalaryDto,
    CurrentEmployeeSalaryDto,
    CreateEmployeeDto,
    UpdateEmployeeDto,
    CreateEmployeeSalaryDto,
    EmployeePositions,
    PayrollSummary
} from './employee-model';

@Component({
    selector: 'app-employees',
    imports: [CommonModule, FormsModule],
    templateUrl: './employees.html',
    styleUrl: './employees.css'
})
export class Employees implements OnInit {
    router = inject(Router);
    employeeService = inject(EmployeeService);
    userService = inject(UserServices);

    currentUser = toSignal(this.userService.currentUser$);

    // State
    employees = toSignal(this.employeeService.employees$, { initialValue: [] });
    loading = toSignal(this.employeeService.loading$, { initialValue: false });
    searchQuery = signal('');
    statusFilter = signal<string>('all');
    payrollSummary = signal<PayrollSummary | null>(null);

    // Modals
    showCreateModal = signal(false);
    showEditModal = signal(false);
    showDeleteConfirm = signal(false);
    showDetailModal = signal(false);
    isSaving = signal(false);
    formError = signal<string>('');

    // Selected
    selectedEmployee = signal<EmployeeDto | null>(null);
    detailEmployee = signal<EmployeeDetailDto | null>(null);
    deleteTarget = signal<EmployeeDto | null>(null);
    currentSalary = signal<CurrentEmployeeSalaryDto | null>(null);
    salaryHistory = signal<EmployeeSalaryDto[]>([]);
    loadingDetail = signal(false);

    // Create form
    createForm = signal<CreateEmployeeDto>({
        residenceId: '',
        firstName: '',
        lastName: '',
        position: 'Gardien',
        email: '',
        phoneNumber: '',
        hireDate: new Date().toISOString().split('T')[0],
        status: EmployeeStatus.Active,
        notes: ''
    });

    // Edit form
    editForm = signal<UpdateEmployeeDto>({
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phoneNumber: '',
        hireDate: '',
        status: EmployeeStatus.Active,
        notes: ''
    });

    // Salary change
    showSalaryModal = signal(false);
    salaryForm = signal<CreateEmployeeSalaryDto>({
        amount: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: '',
        notes: ''
    });

    // Pagination
    currentPage = signal(1);
    pageSize = signal(10);

    // Exposed enums / constants
    EmployeeStatus = EmployeeStatus;
    EmployeePositions = EmployeePositions;

    constructor() { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        const resId = this.currentUser()?.residenceId || this.currentUser()?.residentId || localStorage.getItem('residenceId') || '';
        this.employeeService.getEmployeesByResidence(resId).subscribe();
        this.employeeService.getPayrollSummary(resId).subscribe({
            next: s => this.payrollSummary.set(s),
            error: () => { }
        });
    }

    // ─── Computed ───────────────────────────────────────────
    filteredEmployees = computed(() => {
        let result = this.employees();
        const q = this.searchQuery().toLowerCase();
        const s = this.statusFilter();

        if (s !== 'all') {
            result = result.filter(e => e.status.toString() === s);
        }
        if (q) {
            result = result.filter(e =>
                e.firstName.toLowerCase().includes(q) ||
                e.lastName.toLowerCase().includes(q) ||
                e.position.toLowerCase().includes(q) ||
                (e.email ?? '').toLowerCase().includes(q)
            );
        }
        return result;
    });

    totalItems = computed(() => this.filteredEmployees().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
    showingRangeStart = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1);
    showingRangeEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

    paginatedEmployees = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize();
        return this.filteredEmployees().slice(start, start + this.pageSize());
    });

    activeCount = computed(() => this.employees().filter(e => e.status === EmployeeStatus.Active).length);
    onLeaveCount = computed(() => this.employees().filter(e => e.status === EmployeeStatus.OnLeave).length);
    inactiveCount = computed(() => this.employees().filter(e => e.status === EmployeeStatus.Inactive || e.status === EmployeeStatus.Suspended).length);

    // ─── Actions ────────────────────────────────────────────
    updateSearch(e: Event) {
        this.searchQuery.set((e.target as HTMLInputElement).value);
        this.currentPage.set(1);
    }

    nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
    prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
    setPageSize(size: string) { this.pageSize.set(parseInt(size, 10)); this.currentPage.set(1); }

    // ─── Create ─────────────────────────────────────────────
    openCreate() {
        this.formError.set('');
        this.createForm.set({
            residenceId: '',
            firstName: '',
            lastName: '',
            position: 'Gardien',
            email: '',
            phoneNumber: '',
            hireDate: new Date().toISOString().split('T')[0],
            status: EmployeeStatus.Active,
            notes: ''
        });
        this.showCreateModal.set(true);
    }

    closeCreate() { this.showCreateModal.set(false); }

    saveCreate() {
        this.formError.set('');
        const f = this.createForm();
        if (!f.firstName?.trim()) { this.formError.set('Le prénom est requis'); return; }
        if (!f.lastName?.trim()) { this.formError.set('Le nom est requis'); return; }
        if (!f.position || !f.hireDate) { this.formError.set('Veuillez remplir les champs obligatoires'); return; }

        this.isSaving.set(true);
        const resId = this.currentUser()?.residenceId || this.currentUser()?.residentId || localStorage.getItem('residenceId') || '';
        const payload: CreateEmployeeDto = { ...f, residenceId: resId };
        this.employeeService.createEmployee(payload).subscribe({
            next: () => { this.isSaving.set(false); this.closeCreate(); },
            error: () => this.isSaving.set(false)
        });
    }

    patchCreate(field: string, value: any) {
        this.createForm.update(f => ({ ...f, [field]: value }));
    }

    // ─── Edit ────────────────────────────────────────────────
    openEdit(emp: EmployeeDto) {
        this.formError.set('');
        this.selectedEmployee.set(emp);
        this.editForm.set({
            firstName: emp.firstName,
            lastName: emp.lastName,
            position: emp.position,
            email: emp.email ?? '',
            phoneNumber: emp.phoneNumber ?? '',
            hireDate: emp.hireDate?.split('T')[0] ?? '',
            endDate: emp.endDate?.split('T')[0] ?? '',
            status: emp.status,
            notes: emp.notes ?? ''
        });
        this.showEditModal.set(true);
    }

    closeEdit() { this.showEditModal.set(false); this.selectedEmployee.set(null); }

    saveEdit() {
        this.formError.set('');
        const emp = this.selectedEmployee();
        if (!emp) return;
        
        const f = this.editForm();
        if (!f.firstName?.trim()) { this.formError.set('Le prénom est requis'); return; }
        if (!f.lastName?.trim()) { this.formError.set('Le nom est requis'); return; }
        if (!f.position || !f.hireDate) { this.formError.set('Veuillez remplir les champs obligatoires'); return; }

        const payload: any = {
            ...f,
            endDate: f.endDate === '' ? null : f.endDate
        };

        this.isSaving.set(true);
        this.employeeService.updateEmployee(emp.id, payload).subscribe({
            next: () => { this.isSaving.set(false); this.closeEdit(); },
            error: () => this.isSaving.set(false)
        });
    }

    patchEdit(field: string, value: any) {
        this.editForm.update(f => ({ ...f, [field]: value }));
    }

    // ─── Detail ──────────────────────────────────────────────
    openDetail(emp: EmployeeDto) {
        this.selectedEmployee.set(emp);
        this.loadingDetail.set(true);
        this.showDetailModal.set(true);
        this.employeeService.getEmployeeDetail(emp.id).subscribe({
            next: d => { this.detailEmployee.set(d); this.loadingDetail.set(false); },
            error: () => { this.detailEmployee.set(null); this.loadingDetail.set(false); }
        });
        this.employeeService.getCurrentSalary(emp.id).subscribe({
            next: s => this.currentSalary.set(s),
            error: () => this.currentSalary.set(null)
        });
        this.employeeService.getSalaryHistory(emp.id).subscribe({
            next: h => this.salaryHistory.set(h),
            error: () => this.salaryHistory.set([])
        });
    }

    closeDetail() {
        this.showDetailModal.set(false);
        this.detailEmployee.set(null);
        this.currentSalary.set(null);
        this.salaryHistory.set([]);
    }

    // ─── Salary ──────────────────────────────────────────────
    openSalary() {
        this.salaryForm.set({ amount: this.currentSalary()?.amount ?? 0, effectiveDate: new Date().toISOString().split('T')[0], reason: '', notes: '' });
        this.showSalaryModal.set(true);
    }

    closeSalary() { this.showSalaryModal.set(false); }

    saveSalary() {
        const emp = this.selectedEmployee();
        if (!emp) return;
        this.isSaving.set(true);
        this.employeeService.changeSalary(emp.id, this.salaryForm()).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeSalary();
                this.employeeService.getCurrentSalary(emp.id).subscribe(s => this.currentSalary.set(s));
                this.employeeService.getSalaryHistory(emp.id).subscribe(h => this.salaryHistory.set(h));
            },
            error: () => this.isSaving.set(false)
        });
    }

    patchSalary(field: string, value: any) {
        this.salaryForm.update(f => ({ ...f, [field]: value }));
    }

    // ─── Delete ──────────────────────────────────────────────
    confirmDelete(emp: EmployeeDto) {
        this.deleteTarget.set(emp);
        this.showDeleteConfirm.set(true);
    }

    cancelDelete() { this.showDeleteConfirm.set(false); this.deleteTarget.set(null); }

    executeDelete() {
        const emp = this.deleteTarget();
        if (!emp) return;
        this.employeeService.deleteEmployee(emp.id).subscribe({
            next: () => { this.cancelDelete(); if (this.showDetailModal()) this.closeDetail(); },
            error: () => this.cancelDelete()
        });
    }

    // ─── Helpers ─────────────────────────────────────────────
    getStatusLabel(status: EmployeeStatus): string { return this.employeeService.getStatusLabel(status); }

    getStatusClass(status: EmployeeStatus): string {
        switch (status) {
            case EmployeeStatus.Active: return 'bg-emerald-50 text-emerald-700';
            case EmployeeStatus.OnLeave: return 'bg-amber-50 text-amber-700';
            case EmployeeStatus.Suspended: return 'bg-red-50 text-red-700';
            case EmployeeStatus.Inactive: return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    getStatusIcon(status: EmployeeStatus): string {
        switch (status) {
            case EmployeeStatus.Active: return 'check_circle';
            case EmployeeStatus.OnLeave: return 'beach_access';
            case EmployeeStatus.Suspended: return 'pause_circle';
            case EmployeeStatus.Inactive: return 'cancel';
            default: return 'help';
        }
    }

    getInitials(emp: EmployeeDto): string {
        return `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 2 }).format(amount) + ' TND';
    }
}
