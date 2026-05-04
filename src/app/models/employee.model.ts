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
