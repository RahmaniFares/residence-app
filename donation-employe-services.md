
# Angular Services Guide - Donation & Employee Management

## 📋 Overview

This guide provides complete instructions for creating Angular services that consume the .NET API endpoints for:
- **Donation Management** (`/api/donations`)
- **Employee Management** (`/api/employees`)

## 🎯 Prerequisites

- Angular 14+ (or your current version)
- Node.js & npm installed
- HttpClientModule imported in AppModule
- API base URL configured

## 🏗️ Project Structure

```
src/app/
├── services/
│   ├── donation.service.ts
│   ├── employee.service.ts
│   └── api.service.ts (base service - optional)
├── models/
│   ├── donation.model.ts
│   ├── employee.model.ts
│   └── enums.ts
├── components/
│   ├── donation/
│   │   ├── donation-list/
│   │   ├── donation-detail/
│   │   └── donation-form/
│   └── employee/
│       ├── employee-list/
│       ├── employee-detail/
│       └── employee-form/
└── app.module.ts
```

---

# 📦 Part 1: Models & Interfaces

## 1.1 Donation Models

**File**: `src/app/models/donation.model.ts`

```typescript
export interface CreateDonationDto {
  houseId?: string;
  donorId?: string;
  amount: number;
  donationDate?: Date;
  description?: string;
}

export interface UpdateDonationDto {
  houseId?: string;
  donorId?: string;
  amount?: number;
  donationDate?: Date;
  description?: string;
}

export interface DonationDto {
  id: string;
  houseId?: string;
  donorId?: string;
  amount: number;
  donationDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DonationDetailDto extends DonationDto {
  house?: any;
  donor?: any;
}

export interface DonationSummary {
  totalDonations: number;
  averageDonation: number;
  largestDonation: number;
  smallestDonation: number;
}

export interface DonationByHouseSummary {
  houseId: string;
  houseName?: string;
  totalAmount: number;
  donationCount: number;
  averageAmount: number;
}
```

## 1.2 Employee Models

**File**: `src/app/models/employee.model.ts`

```typescript
export enum EmployeeStatus {
  Active = 0,
  OnLeave = 1,
  Suspended = 2,
  Inactive = 3
}

export interface CreateEmployeeDto {
  residenceId: string;
  firstName: string;
  lastName: string;
  position: string;
  email?: string;
  phoneNumber?: string;
  hireDate: Date;
  endDate?: Date;
  status?: EmployeeStatus;
  notes?: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phoneNumber?: string;
  hireDate?: Date;
  endDate?: Date;
  status?: EmployeeStatus;
  notes?: string;
}

export interface EmployeeDto {
  id: string;
  residenceId: string;
  firstName: string;
  lastName: string;
  position: string;
  email?: string;
  phoneNumber?: string;
  hireDate: Date;
  endDate?: Date;
  status: EmployeeStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface EmployeeDetailDto extends EmployeeDto {
  residence?: any;
  currentSalary?: CurrentEmployeeSalaryDto;
  salaryHistory?: EmployeeSalaryDto[];
}

export interface EmployeeSalaryDto {
  id: string;
  employeeId: string;
  amount: number;
  effectiveDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  reason?: string;
  notes?: string;
  periodDisplay?: string;
}

export interface CurrentEmployeeSalaryDto {
  id: string;
  amount: number;
  effectiveDate: Date;
  isCurrent: boolean;
}

export interface CreateEmployeeSalaryDto {
  amount: number;
  effectiveDate: Date;
  reason?: string;
  notes?: string;
}

export interface EmployeeSummaryDto {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  averageSalary: number;
  employeesByPosition: PositionSummary[];
}

export interface PositionSummary {
  position: string;
  count: number;
  averageSalary: number;
  totalPayroll: number;
}

export interface PayrollSummary {
  residenceId: string;
  totalMonthlyPayroll: number;
  totalEmployees: number;
  averageSalary: number;
  employeesByPosition: PositionSummary[];
}
```

## 1.3 Enums

**File**: `src/app/models/enums.ts`

```typescript
export enum EmployeeStatus {
  Active = 0,
  OnLeave = 1,
  Suspended = 2,
  Inactive = 3
}

export const EmployeeStatusLabels: { [key in EmployeeStatus]: string } = {
  [EmployeeStatus.Active]: 'Active',
  [EmployeeStatus.OnLeave]: 'On Leave',
  [EmployeeStatus.Suspended]: 'Suspended',
  [EmployeeStatus.Inactive]: 'Inactive'
};

export const EmployeePositions = [
  'Gardien',
  'Femme de ménage',
  'Maintenance',
  'Directeur',
  'Secrétaire',
  'Autre'
];
```

---

# 🔧 Part 2: Base Service (Optional but Recommended)

## 2.1 API Base Service

**File**: `src/app/services/api.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
	return this.http.get<T>(`${this.apiUrl}${endpoint}`, { params });
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
	return this.http.post<T>(`${this.apiUrl}${endpoint}`, body);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
	return this.http.put<T>(`${this.apiUrl}${endpoint}`, body);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
	return this.http.delete<T>(`${this.apiUrl}${endpoint}`);
  }

  /**
   * Build query parameters
   */
  buildParams(params: any): HttpParams {
	let httpParams = new HttpParams();
	Object.keys(params).forEach(key => {
	  if (params[key] !== null && params[key] !== undefined) {
		httpParams = httpParams.set(key, params[key].toString());
	  }
	});
	return httpParams;
  }
}
```

**File**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5062/api'
};

export const environment_prod = {
  production: true,
  apiUrl: 'https://your-api.com/api'
};
```

---

# 🎁 Part 3: Donation Service

## 3.1 Complete Donation Service

**File**: `src/app/services/donation.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DonationDto,
  DonationDetailDto,
  CreateDonationDto,
  UpdateDonationDto,
  DonationSummary,
  DonationByHouseSummary
} from '../models/donation.model';

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  private apiUrl = `${environment.apiUrl}/donations`;

  // Subject for reactive data management
  private donationsSubject = new BehaviorSubject<DonationDto[]>([]);
  public donations$ = this.donationsSubject.asObservable();

  private selectedDonationSubject = new BehaviorSubject<DonationDto | null>(null);
  public selectedDonation$ = this.selectedDonationSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * CRUD Operations
   */

  /**
   * Create a new donation
   */
  createDonation(donation: CreateDonationDto): Observable<DonationDto> {
	return this.http.post<DonationDto>(`${this.apiUrl}/`, donation);
  }

  /**
   * Get donation by ID
   */
  getDonationById(id: string): Observable<DonationDto> {
	return this.http.get<DonationDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update donation
   */
  updateDonation(id: string, donation: UpdateDonationDto): Observable<DonationDto> {
	return this.http.put<DonationDto>(`${this.apiUrl}/${id}`, donation);
  }

  /**
   * Delete donation
   */
  deleteDonation(id: string): Observable<void> {
	return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Query Operations
   */

  /**
   * Get all donations
   */
  getAllDonations(): Observable<DonationDto[]> {
	this.setLoading(true);
	return this.http.get<DonationDto[]>(`${this.apiUrl}/`);
  }

  /**
   * Get donations by house
   */
  getDonationsByHouse(houseId: string): Observable<DonationDto[]> {
	return this.http.get<DonationDto[]>(`${this.apiUrl}/house/${houseId}`);
  }

  /**
   * Get donations by donor
   */
  getDonationsByDonor(donorId: string): Observable<DonationDto[]> {
	return this.http.get<DonationDto[]>(`${this.apiUrl}/donor/${donorId}`);
  }

  /**
   * Get donations by date range
   */
  getDonationsByDateRange(
	startDate: Date,
	endDate: Date
  ): Observable<DonationDto[]> {
	const params = new HttpParams()
	  .set('startDate', this.formatDate(startDate))
	  .set('endDate', this.formatDate(endDate));

	return this.http.get<DonationDto[]>(`${this.apiUrl}/by-date-range`, { params });
  }

  /**
   * Statistics Operations
   */

  /**
   * Get total donations by house
   */
  getTotalDonationsByHouse(houseId: string): Observable<{ houseId: string; total: number }> {
	return this.http.get<{ houseId: string; total: number }>(
	  `${this.apiUrl}/house/${houseId}/total`
	);
  }

  /**
   * Get total donations by donor
   */
  getTotalDonationsByDonor(donorId: string): Observable<{ donorId: string; total: number }> {
	return this.http.get<{ donorId: string; total: number }>(
	  `${this.apiUrl}/statistics/total-by-donor?donorId=${donorId}`
	);
  }

  /**
   * Get donation details
   */
  getDonationDetails(id: string): Observable<DonationDetailDto> {
	return this.http.get<DonationDetailDto>(`${this.apiUrl}/${id}/details`);
  }

  /**
   * Helper Methods
   */

  /**
   * Set selected donation
   */
  setSelectedDonation(donation: DonationDto): void {
	this.selectedDonationSubject.next(donation);
  }

  /**
   * Clear selected donation
   */
  clearSelectedDonation(): void {
	this.selectedDonationSubject.next(null);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
	this.loadingSubject.next(loading);
  }

  /**
   * Format date to ISO string
   */
  private formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
  }

  /**
   * Update donations list
   */
  refreshDonations(): Observable<DonationDto[]> {
	this.setLoading(true);
	return this.http.get<DonationDto[]>(`${this.apiUrl}/`);
  }

  /**
   * Calculate donation statistics
   */
  calculateStats(donations: DonationDto[]): DonationSummary {
	if (donations.length === 0) {
	  return {
		totalDonations: 0,
		averageDonation: 0,
		largestDonation: 0,
		smallestDonation: 0
	  };
	}

	const amounts = donations.map(d => d.amount);
	const total = amounts.reduce((sum, amount) => sum + amount, 0);

	return {
	  totalDonations: total,
	  averageDonation: total / donations.length,
	  largestDonation: Math.max(...amounts),
	  smallestDonation: Math.min(...amounts)
	};
  }
}
```

---

# 👥 Part 4: Employee Service

## 4.1 Complete Employee Service

**File**: `src/app/services/employee.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EmployeeDto,
  EmployeeDetailDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeSalaryDto,
  CurrentEmployeeSalaryDto,
  CreateEmployeeSalaryDto,
  PayrollSummary,
  EmployeeStatus
} from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  // Subjects for reactive data
  private employeesSubject = new BehaviorSubject<EmployeeDto[]>([]);
  public employees$ = this.employeesSubject.asObservable();

  private selectedEmployeeSubject = new BehaviorSubject<EmployeeDto | null>(null);
  public selectedEmployee$ = this.selectedEmployeeSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * CRUD Operations
   */

  /**
   * Create new employee
   */
  createEmployee(employee: CreateEmployeeDto): Observable<EmployeeDto> {
	return this.http.post<EmployeeDto>(`${this.apiUrl}/`, employee);
  }

  /**
   * Get employee by ID
   */
  getEmployee(id: string): Observable<EmployeeDto> {
	return this.http.get<EmployeeDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get employee with full details
   */
  getEmployeeDetail(id: string): Observable<EmployeeDetailDto> {
	return this.http.get<EmployeeDetailDto>(`${this.apiUrl}/${id}/detail`);
  }

  /**
   * Update employee
   */
  updateEmployee(id: string, employee: UpdateEmployeeDto): Observable<EmployeeDto> {
	return this.http.put<EmployeeDto>(`${this.apiUrl}/${id}`, employee);
  }

  /**
   * Delete employee
   */
  deleteEmployee(id: string): Observable<void> {
	return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all employees
   */
  getAllEmployees(): Observable<EmployeeDto[]> {
	this.setLoading(true);
	return this.http.get<EmployeeDto[]>(`${this.apiUrl}/`);
  }

  /**
   * Query Operations
   */

  /**
   * Get employees by residence
   */
  getEmployeesByResidence(residenceId: string): Observable<EmployeeDto[]> {
	return this.http.get<EmployeeDto[]>(`${this.apiUrl}/residence/${residenceId}`);
  }

  /**
   * Get active employees by residence
   */
  getActiveEmployees(residenceId: string): Observable<EmployeeDto[]> {
	return this.http.get<EmployeeDto[]>(
	  `${this.apiUrl}/residence/${residenceId}/active`
	);
  }

  /**
   * Get employees by position
   */
  getEmployeesByPosition(
	residenceId: string,
	position: string
  ): Observable<EmployeeDto[]> {
	const params = new HttpParams().set('position', position);
	return this.http.get<EmployeeDto[]>(
	  `${this.apiUrl}/residence/${residenceId}/position`,
	  { params }
	);
  }

  /**
   * Get employee count
   */
  getEmployeeCount(residenceId: string): Observable<{ count: number }> {
	return this.http.get<{ count: number }>(
	  `${this.apiUrl}/residence/${residenceId}/count`
	);
  }

  /**
   * Salary Operations
   */

  /**
   * Get current salary
   */
  getCurrentSalary(employeeId: string): Observable<CurrentEmployeeSalaryDto> {
	return this.http.get<CurrentEmployeeSalaryDto>(
	  `${this.apiUrl}/${employeeId}/salary/current`
	);
  }

  /**
   * Get salary history
   */
  getSalaryHistory(employeeId: string): Observable<EmployeeSalaryDto[]> {
	return this.http.get<EmployeeSalaryDto[]>(
	  `${this.apiUrl}/${employeeId}/salary/history`
	);
  }

  /**
   * Get paged salary history
   */
  getSalaryHistoryPaged(
	employeeId: string,
	pageNumber: number = 1,
	pageSize: number = 10
  ): Observable<any> {
	const params = new HttpParams()
	  .set('pageNumber', pageNumber.toString())
	  .set('pageSize', pageSize.toString());

	return this.http.get<any>(
	  `${this.apiUrl}/${employeeId}/salary/history-paged`,
	  { params }
	);
  }

  /**
   * Get salary at specific date
   */
  getSalaryAtDate(employeeId: string, date: Date): Observable<EmployeeSalaryDto> {
	const params = new HttpParams().set('date', this.formatDate(date));
	return this.http.get<EmployeeSalaryDto>(
	  `${this.apiUrl}/${employeeId}/salary/at-date`,
	  { params }
	);
  }

  /**
   * Change employee salary
   */
  changeSalary(
	employeeId: string,
	salary: CreateEmployeeSalaryDto
  ): Observable<EmployeeSalaryDto> {
	return this.http.post<EmployeeSalaryDto>(
	  `${this.apiUrl}/${employeeId}/salary/change`,
	  salary
	);
  }

  /**
   * Get salaries in date range
   */
  getSalariesInRange(
	employeeId: string,
	startDate: Date,
	endDate: Date
  ): Observable<EmployeeSalaryDto[]> {
	const body = {
	  startDate: this.formatDate(startDate),
	  endDate: this.formatDate(endDate)
	};
	return this.http.post<EmployeeSalaryDto[]>(
	  `${this.apiUrl}/${employeeId}/salary/date-range`,
	  body
	);
  }

  /**
   * Payroll Operations
   */

  /**
   * Get total monthly payroll
   */
  getTotalPayroll(residenceId: string): Observable<{ total: number }> {
	return this.http.get<{ total: number }>(
	  `${this.apiUrl}/payroll/${residenceId}/total`
	);
  }

  /**
   * Get average salary by position
   */
  getPositionAverage(residenceId: string): Observable<any> {
	return this.http.get<any>(
	  `${this.apiUrl}/payroll/${residenceId}/position-average`
	);
  }

  /**
   * Get payroll summary
   */
  getPayrollSummary(residenceId: string): Observable<PayrollSummary> {
	return this.http.get<PayrollSummary>(
	  `${this.apiUrl}/payroll/${residenceId}/summary`
	);
  }

  /**
   * Helper Methods
   */

  /**
   * Set selected employee
   */
  setSelectedEmployee(employee: EmployeeDto): void {
	this.selectedEmployeeSubject.next(employee);
  }

  /**
   * Clear selected employee
   */
  clearSelectedEmployee(): void {
	this.selectedEmployeeSubject.next(null);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
	this.loadingSubject.next(loading);
  }

  /**
   * Format date to ISO string
   */
  private formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
  }

  /**
   * Get status label
   */
  getStatusLabel(status: EmployeeStatus): string {
	const labels: { [key in EmployeeStatus]: string } = {
	  [EmployeeStatus.Active]: 'Active',
	  [EmployeeStatus.OnLeave]: 'On Leave',
	  [EmployeeStatus.Suspended]: 'Suspended',
	  [EmployeeStatus.Inactive]: 'Inactive'
	};
	return labels[status];
  }

  /**
   * Get full employee name
   */
  getFullName(employee: EmployeeDto): string {
	return `${employee.firstName} ${employee.lastName}`.trim();
  }

  /**
   * Refresh employees list
   */
  refreshEmployees(residenceId?: string): Observable<EmployeeDto[]> {
	this.setLoading(true);
	if (residenceId) {
	  return this.getEmployeesByResidence(residenceId);
	}
	return this.getAllEmployees();
  }
}
```

---

# 🔌 Part 5: Module Configuration

## 5.1 App Module Setup

**File**: `src/app/app.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

// Import services
import { DonationService } from './services/donation.service';
import { EmployeeService } from './services/employee.service';
import { ApiService } from './services/api.service';

@NgModule({
  declarations: [
	AppComponent
	// Add your components here
  ],
  imports: [
	BrowserModule,
	HttpClientModule,
	ReactiveFormsModule,
	FormsModule
  ],
  providers: [
	DonationService,
	EmployeeService,
	ApiService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

# 📱 Part 6: Component Examples

## 6.1 Donation List Component

**File**: `src/app/components/donation/donation-list/donation-list.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DonationService } from '../../../services/donation.service';
import { DonationDto } from '../../../models/donation.model';

@Component({
  selector: 'app-donation-list',
  templateUrl: './donation-list.component.html',
  styleUrls: ['./donation-list.component.css']
})
export class DonationListComponent implements OnInit, OnDestroy {
  donations: DonationDto[] = [];
  loading = false;
  selectedDonation: DonationDto | null = null;
  private destroy$ = new Subject<void>();

  constructor(private donationService: DonationService) {}

  ngOnInit(): void {
	this.loadDonations();

	// Subscribe to donations
	this.donationService.donations$
	  .pipe(takeUntil(this.destroy$))
	  .subscribe(donations => {
		this.donations = donations;
	  });

	// Subscribe to loading state
	this.donationService.loading$
	  .pipe(takeUntil(this.destroy$))
	  .subscribe(loading => {
		this.loading = loading;
	  });
  }

  loadDonations(): void {
	this.donationService.getAllDonations()
	  .pipe(takeUntil(this.destroy$))
	  .subscribe({
		next: (data) => {
		  this.donations = data;
		},
		error: (error) => {
		  console.error('Error loading donations:', error);
		}
	  });
  }

  selectDonation(donation: DonationDto): void {
	this.donationService.setSelectedDonation(donation);
	this.selectedDonation = donation;
  }

  deleteDonation(id: string): void {
	if (confirm('Are you sure you want to delete this donation?')) {
	  this.donationService.deleteDonation(id)
		.pipe(takeUntil(this.destroy$))
		.subscribe({
		  next: () => {
			this.donations = this.donations.filter(d => d.id !== id);
		  },
		  error: (error) => {
			console.error('Error deleting donation:', error);
		  }
		});
	}
  }

  ngOnDestroy(): void {
	this.destroy$.next();
	this.destroy$.complete();
  }
}
```

**File**: `src/app/components/donation/donation-list/donation-list.component.html`

```html
<div class="donation-list">
  <h2>Donations</h2>

  <div *ngIf="loading" class="loading">Loading...</div>

  <div *ngIf="!loading && donations.length === 0" class="no-data">
	No donations found
  </div>

  <table *ngIf="!loading && donations.length > 0" class="table">
	<thead>
	  <tr>
		<th>Date</th>
		<th>Amount</th>
		<th>House</th>
		<th>Donor</th>
		<th>Actions</th>
	  </tr>
	</thead>
	<tbody>
	  <tr *ngFor="let donation of donations" 
		  [class.selected]="selectedDonation?.id === donation.id">
		<td>{{ donation.donationDate | date: 'short' }}</td>
		<td>{{ donation.amount | currency: 'EUR' }}</td>
		<td>{{ donation.houseId }}</td>
		<td>{{ donation.donorId }}</td>
		<td>
		  <button (click)="selectDonation(donation)" class="btn-select">View</button>
		  <button (click)="deleteDonation(donation.id)" class="btn-delete">Delete</button>
		</td>
	  </tr>
	</tbody>
  </table>
</div>
```

## 6.2 Employee List Component

**File**: `src/app/components/employee/employee-list/employee-list.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../../services/employee.service';
import { EmployeeDto } from '../../../models/employee.model';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  employees: EmployeeDto[] = [];
  loading = false;
  selectedEmployee: EmployeeDto | null = null;
  residenceId: string = ''; // Set from parent or route
  private destroy$ = new Subject<void>();

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
	this.loadEmployees();

	this.employeeService.employees$
	  .pipe(takeUntil(this.destroy$))
	  .subscribe(employees => {
		this.employees = employees;
	  });

	this.employeeService.loading$
	  .pipe(takeUntil(this.destroy$))
	  .subscribe(loading => {
		this.loading = loading;
	  });
  }

  loadEmployees(): void {
	if (this.residenceId) {
	  this.employeeService.getEmployeesByResidence(this.residenceId)
		.pipe(takeUntil(this.destroy$))
		.subscribe({
		  next: (data) => {
			this.employees = data;
		  },
		  error: (error) => {
			console.error('Error loading employees:', error);
		  }
		});
	}
  }

  selectEmployee(employee: EmployeeDto): void {
	this.employeeService.setSelectedEmployee(employee);
	this.selectedEmployee = employee;
  }

  deleteEmployee(id: string): void {
	if (confirm('Are you sure you want to delete this employee?')) {
	  this.employeeService.deleteEmployee(id)
		.pipe(takeUntil(this.destroy$))
		.subscribe({
		  next: () => {
			this.employees = this.employees.filter(e => e.id !== id);
		  },
		  error: (error) => {
			console.error('Error deleting employee:', error);
		  }
		});
	}
  }

  getStatusLabel(status: number): string {
	return this.employeeService.getStatusLabel(status);
  }

  ngOnDestroy(): void {
	this.destroy$.next();
	this.destroy$.complete();
  }
}
```

**File**: `src/app/components/employee/employee-list/employee-list.component.html`

```html
<div class="employee-list">
  <h2>Employees</h2>

  <div *ngIf="loading" class="loading">Loading...</div>

  <div *ngIf="!loading && employees.length === 0" class="no-data">
	No employees found
  </div>

  <table *ngIf="!loading && employees.length > 0" class="table">
	<thead>
	  <tr>
		<th>Name</th>
		<th>Position</th>
		<th>Email</th>
		<th>Phone</th>
		<th>Status</th>
		<th>Hire Date</th>
		<th>Actions</th>
	  </tr>
	</thead>
	<tbody>
	  <tr *ngFor="let employee of employees" 
		  [class.selected]="selectedEmployee?.id === employee.id">
		<td>{{ employee.firstName }} {{ employee.lastName }}</td>
		<td>{{ employee.position }}</td>
		<td>{{ employee.email }}</td>
		<td>{{ employee.phoneNumber }}</td>
		<td>
		  <span [class]="'status-' + employee.status">
			{{ getStatusLabel(employee.status) }}
		  </span>
		</td>
		<td>{{ employee.hireDate | date: 'short' }}</td>
		<td>
		  <button (click)="selectEmployee(employee)" class="btn-select">View</button>
		  <button (click)="deleteEmployee(employee.id)" class="btn-delete">Delete</button>
		</td>
	  </tr>
	</tbody>
  </table>
</div>
```

---

# 🧪 Part 7: Usage Examples

## 7.1 Using Donation Service

```typescript
// In a component
import { DonationService } from './services/donation.service';

@Component({...})
export class MyComponent {
  constructor(private donationService: DonationService) {}

  // Get all donations
  getAllDonations() {
	this.donationService.getAllDonations().subscribe({
	  next: (donations) => console.log(donations),
	  error: (error) => console.error(error)
	});
  }

  // Get donations for a house
  getHouseDonations(houseId: string) {
	this.donationService.getDonationsByHouse(houseId).subscribe({
	  next: (donations) => console.log(donations),
	  error: (error) => console.error(error)
	});
  }

  // Create donation
  addDonation(houseId: string, amount: number) {
	const donation = {
	  houseId,
	  amount,
	  description: 'Monthly donation'
	};

	this.donationService.createDonation(donation).subscribe({
	  next: (created) => console.log('Donation created:', created),
	  error: (error) => console.error(error)
	});
  }

  // Get donation statistics
  getStats(donations: DonationDto[]) {
	const stats = this.donationService.calculateStats(donations);
	console.log(`Total: ${stats.totalDonations}€`);
	console.log(`Average: ${stats.averageDonation}€`);
  }
}
```

## 7.2 Using Employee Service

```typescript
// In a component
import { EmployeeService } from './services/employee.service';

@Component({...})
export class MyComponent {
  constructor(private employeeService: EmployeeService) {}

  // Get employees by residence
  getResidenceEmployees(residenceId: string) {
	this.employeeService.getEmployeesByResidence(residenceId).subscribe({
	  next: (employees) => console.log(employees),
	  error: (error) => console.error(error)
	});
  }

  // Get active employees
  getActiveEmployees(residenceId: string) {
	this.employeeService.getActiveEmployees(residenceId).subscribe({
	  next: (employees) => console.log(employees),
	  error: (error) => console.error(error)
	});
  }

  // Create employee
  addEmployee(employee: CreateEmployeeDto) {
	this.employeeService.createEmployee(employee).subscribe({
	  next: (created) => console.log('Employee created:', created),
	  error: (error) => console.error(error)
	});
  }

  // Get payroll summary
  getPayroll(residenceId: string) {
	this.employeeService.getPayrollSummary(residenceId).subscribe({
	  next: (summary) => {
		console.log(`Total: ${summary.totalMonthlyPayroll}€`);
		console.log(`Employees: ${summary.totalEmployees}`);
	  },
	  error: (error) => console.error(error)
	});
  }

  // Change salary
  updateSalary(employeeId: string, newAmount: number) {
	const salary = {
	  amount: newAmount,
	  effectiveDate: new Date(),
	  reason: 'Annual increase'
	};

	this.employeeService.changeSalary(employeeId, salary).subscribe({
	  next: (updated) => console.log('Salary updated:', updated),
	  error: (error) => console.error(error)
	});
  }
}
```

---

# 📋 Part 8: Advanced Patterns

## 8.1 Caching with ReplaySubject

```typescript
import { ReplaySubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export class DonationService {
  private donationsCache$ = new ReplaySubject<DonationDto[]>(1);

  getAllDonations(): Observable<DonationDto[]> {
	return this.http.get<DonationDto[]>(`${this.apiUrl}/`)
	  .pipe(shareReplay(1));
  }
}
```

## 8.2 Error Handling with Interceptor

**File**: `src/app/interceptors/error.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
	request: HttpRequest<any>,
	next: HttpHandler
  ): Observable<HttpEvent<any>> {
	return next.handle(request).pipe(
	  catchError((error: HttpErrorResponse) => {
		let errorMessage = 'An error occurred';

		if (error.error instanceof ErrorEvent) {
		  errorMessage = `Error: ${error.error.message}`;
		} else {
		  errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
		}

		console.error(errorMessage);
		return throwError(() => new Error(errorMessage));
	  })
	);
  }
}
```

---

# 🎯 Part 9: Testing

## 9.1 Unit Test Example

**File**: `src/app/services/donation.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonationService } from './donation.service';
import { DonationDto } from '../models/donation.model';

describe('DonationService', () => {
  let service: DonationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
	TestBed.configureTestingModule({
	  imports: [HttpClientTestingModule],
	  providers: [DonationService]
	});

	service = TestBed.inject(DonationService);
	httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
	httpMock.verify();
  });

  it('should fetch all donations', () => {
	const mockDonations: DonationDto[] = [
	  {
		id: '1',
		houseId: 'house-1',
		amount: 100,
		donationDate: new Date(),
		createdAt: new Date()
	  }
	];

	service.getAllDonations().subscribe(donations => {
	  expect(donations.length).toBe(1);
	  expect(donations[0].amount).toBe(100);
	});

	const req = httpMock.expectOne('/api/donations/');
	expect(req.request.method).toBe('GET');
	req.flush(mockDonations);
  });

  it('should create a donation', () => {
	const newDonation = {
	  houseId: 'house-1',
	  amount: 150
	};

	const mockResponse: DonationDto = {
	  id: '1',
	  ...newDonation,
	  donationDate: new Date(),
	  createdAt: new Date()
	};

	service.createDonation(newDonation).subscribe(result => {
	  expect(result.id).toBe('1');
	  expect(result.amount).toBe(150);
	});

	const req = httpMock.expectOne('/api/donations/');
	expect(req.request.method).toBe('POST');
	req.flush(mockResponse);
  });
});
```

---

# 📋 Part 10: API Endpoint Reference

## Donation Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/donations/` | Create donation |
| GET | `/api/donations/` | Get all donations |
| GET | `/api/donations/{id}` | Get donation by ID |
| PUT | `/api/donations/{id}` | Update donation |
| DELETE | `/api/donations/{id}` | Delete donation |
| GET | `/api/donations/house/{houseId}` | Get by house |
| GET | `/api/donations/donor/{donorId}` | Get by donor |
| GET | `/api/donations/by-date-range` | Get by date range |
| GET | `/api/donations/house/{houseId}/total` | Total by house |
| GET | `/api/donations/{id}/details` | Get details |
| GET | `/api/donations/statistics/total-by-donor` | Total by donor |

## Employee Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/employees/` | Create employee |
| GET | `/api/employees/` | Get all employees |
| GET | `/api/employees/{id}` | Get employee by ID |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Delete employee |
| GET | `/api/employees/{id}/detail` | Get with details |
| GET | `/api/employees/residence/{residenceId}` | Get by residence |
| GET | `/api/employees/residence/{residenceId}/active` | Get active |
| GET | `/api/employees/residence/{residenceId}/position` | Get by position |
| GET | `/api/employees/residence/{residenceId}/count` | Get count |
| GET | `/api/employees/{id}/salary/current` | Current salary |
| GET | `/api/employees/{id}/salary/history` | Salary history |
| GET | `/api/employees/{id}/salary/history-paged` | Paged history |
| POST | `/api/employees/{id}/salary/change` | Change salary |
| GET | `/api/employees/{id}/salary/at-date` | Salary at date |
| POST | `/api/employees/{id}/salary/date-range` | Salaries in range |
| GET | `/api/employees/payroll/{residenceId}/total` | Total payroll |
| GET | `/api/employees/payroll/{residenceId}/position-average` | Avg by position |
| GET | `/api/employees/payroll/{residenceId}/summary` | Payroll summary |

---

# ✅ Checklist

- [ ] Created models in `src/app/models/`
- [ ] Created base API service
- [ ] Created DonationService
- [ ] Created EmployeeService
- [ ] Added HttpClientModule to AppModule
- [ ] Configured environment files
- [ ] Created list components
- [ ] Created form components
- [ ] Added services to providers
- [ ] Implemented error handling
- [ ] Created unit tests
- [ ] Tested all endpoints

---

**Created**: 2024
**Framework**: Angular 14+
**API**: ASP.NET Core 8 (.NET 8)
**Status**: Ready to use ✓
