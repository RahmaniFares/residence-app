import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
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
} from './employee-model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private apiUrl = `${environment.apiUrl}/employees`;
    private residenceId = environment.residenceId;

    private employeesSubject = new BehaviorSubject<EmployeeDto[]>([]);
    public employees$ = this.employeesSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    /** Get all employees for the current residence */
    getEmployeesByResidence(residenceId: string = this.residenceId): Observable<EmployeeDto[]> {
        this.loadingSubject.next(true);
        return this.http.get<EmployeeDto[]>(`${this.apiUrl}/residence/${residenceId}`).pipe(
            tap({
                next: (data) => {
                    this.employeesSubject.next(data);
                    this.loadingSubject.next(false);
                },
                error: () => this.loadingSubject.next(false)
            })
        );
    }

    /** Get active employees for the current residence */
    getActiveEmployees(): Observable<EmployeeDto[]> {
        return this.http.get<EmployeeDto[]>(`${this.apiUrl}/residence/${this.residenceId}/active`);
    }

    /** Get employee by ID */
    getEmployee(id: string): Observable<EmployeeDto> {
        return this.http.get<EmployeeDto>(`${this.apiUrl}/${id}`);
    }

    /** Get employee with full details (salary history, etc.) */
    getEmployeeDetail(id: string): Observable<EmployeeDetailDto> {
        return this.http.get<EmployeeDetailDto>(`${this.apiUrl}/${id}/detail`);
    }

    /** Create new employee */
    createEmployee(employee: CreateEmployeeDto): Observable<EmployeeDto> {
        return this.http.post<EmployeeDto>(`${this.apiUrl}/`, employee).pipe(
            tap(newEmp => {
                const current = this.employeesSubject.value;
                this.employeesSubject.next([newEmp, ...current]);
            })
        );
    }

    /** Update employee */
    updateEmployee(id: string, employee: UpdateEmployeeDto): Observable<EmployeeDto> {
        return this.http.put<EmployeeDto>(`${this.apiUrl}/${id}`, employee).pipe(
            tap(updated => {
                const current = this.employeesSubject.value;
                const idx = current.findIndex(e => e.id === id);
                if (idx !== -1) {
                    current[idx] = updated;
                    this.employeesSubject.next([...current]);
                }
            })
        );
    }

    /** Delete employee */
    deleteEmployee(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const current = this.employeesSubject.value;
                this.employeesSubject.next(current.filter(e => e.id !== id));
            })
        );
    }

    /** Get current salary */
    getCurrentSalary(employeeId: string): Observable<CurrentEmployeeSalaryDto> {
        return this.http.get<CurrentEmployeeSalaryDto>(`${this.apiUrl}/${employeeId}/salary/current`);
    }

    /** Get salary history */
    getSalaryHistory(employeeId: string): Observable<EmployeeSalaryDto[]> {
        return this.http.get<EmployeeSalaryDto[]>(`${this.apiUrl}/${employeeId}/salary/history`);
    }

    /** Change salary */
    changeSalary(employeeId: string, salary: CreateEmployeeSalaryDto): Observable<EmployeeSalaryDto> {
        return this.http.post<EmployeeSalaryDto>(`${this.apiUrl}/${employeeId}/salary/change`, salary);
    }

    /** Get payroll summary */
    getPayrollSummary(residenceId: string = this.residenceId): Observable<PayrollSummary> {
        return this.http.get<PayrollSummary>(`${this.apiUrl}/payroll/${residenceId}/summary`);
    }

    /** Get employee count */
    getEmployeeCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}/residence/${this.residenceId}/count`);
    }

    /** Get status label in French */
    getStatusLabel(status: EmployeeStatus): string {
        const labels: { [key in EmployeeStatus]: string } = {
            [EmployeeStatus.Active]: 'Actif',
            [EmployeeStatus.OnLeave]: 'En congé',
            [EmployeeStatus.Suspended]: 'Suspendu',
            [EmployeeStatus.Inactive]: 'Inactif'
        };
        return labels[status] ?? 'Inconnu';
    }

    /** Get full name */
    getFullName(employee: EmployeeDto): string {
        return `${employee.firstName} ${employee.lastName}`.trim();
    }
}
