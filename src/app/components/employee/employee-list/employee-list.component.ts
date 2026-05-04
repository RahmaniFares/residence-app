import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../../services/employee.service';
import { EmployeeDto } from '../../../models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
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
