import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
  getEmployeesByResidence(residenceId: string = environment.residenceId): Observable<EmployeeDto[]> {
    this.setLoading(true);
    return this.http.get<EmployeeDto[]>(`${this.apiUrl}/residence/${residenceId}`).pipe(
      tap({
        next: (employees: EmployeeDto[]) => {
          this.employeesSubject.next(employees);
          this.setLoading(false);
        },
        error: () => this.setLoading(false)
      })
    );
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
  getPayrollSummary(residenceId: string = environment.residenceId): Observable<PayrollSummary> {
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

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', { 
        style: 'currency', 
        currency: 'TND',
        minimumFractionDigits: 2 
    }).format(amount);
  }
}
