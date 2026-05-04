export enum EmployeeStatus {
    Active = 0,
    OnLeave = 1,
    Suspended = 2,
    Inactive = 3
}

export const EmployeeStatusLabels: { [key in EmployeeStatus]: string } = {
    [EmployeeStatus.Active]: 'Actif',
    [EmployeeStatus.OnLeave]: 'En congé',
    [EmployeeStatus.Suspended]: 'Suspendu',
    [EmployeeStatus.Inactive]: 'Inactif'
};

export const EmployeePositions = [
    'Gardien',
    'Femme de ménage',
    'Maintenance',
    'Directeur',
    'Secrétaire',
    'Autre'
];

export interface CreateEmployeeDto {
    residenceId: string;
    firstName: string;
    lastName: string;
    position: string;
    email?: string;
    phoneNumber?: string;
    hireDate: string;
    endDate?: string;
    status?: EmployeeStatus;
    notes?: string;
}

export interface UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    position?: string;
    email?: string;
    phoneNumber?: string;
    hireDate?: string;
    endDate?: string;
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
    hireDate: string;
    endDate?: string;
    status: EmployeeStatus;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
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
    effectiveDate: string;
    endDate?: string;
    isCurrent: boolean;
    reason?: string;
    notes?: string;
    periodDisplay?: string;
}

export interface CurrentEmployeeSalaryDto {
    id: string;
    amount: number;
    effectiveDate: string;
    isCurrent: boolean;
}

export interface CreateEmployeeSalaryDto {
    amount: number;
    effectiveDate: string;
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
