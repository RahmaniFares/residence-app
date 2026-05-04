// ============================================================
// Expense Type Enum (mirrors backend ExpenseType enum)
// ============================================================
export enum ExpenseType {
    Maintenance = 0,
    Electricity = 1,
    Water = 2,
    Cleaning = 3,
    Security = 4,
    Gardening = 5,
    Repairs = 6,
    Equipment = 7,
    Insurance = 8,
    Taxes = 9,
    Other = 10
}

// ============================================================
// French display labels mapped to backend enum values
// ============================================================
export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
    [ExpenseType.Maintenance]: 'Maintenance',
    [ExpenseType.Electricity]: 'Électricité',
    [ExpenseType.Water]: 'Eau',
    [ExpenseType.Cleaning]: 'Nettoyage',
    [ExpenseType.Security]: 'Sécurité',
    [ExpenseType.Gardening]: 'Jardinage',
    [ExpenseType.Repairs]: 'Réparations',
    [ExpenseType.Equipment]: 'Équipements',
    [ExpenseType.Insurance]: 'Assurance',
    [ExpenseType.Taxes]: 'Taxes',
    [ExpenseType.Other]: 'Autre'
};

export const DEPENSE_TYPES: { value: ExpenseType; label: string }[] = Object.entries(EXPENSE_TYPE_LABELS).map(
    ([value, label]) => ({ value: +value as ExpenseType, label })
);

// ============================================================
// Response DTOs (from backend)
// ============================================================

export interface ExpenseImageDto {
    id: string;
    expenseId: string;
    imageUrl: string;
    createdAt: Date;
}

/** Main expense response — used as the front-end display model (DepenseModel) */
export interface DepenseModel {
    id: string;
    residenceId: string;
    title: string;
    type: ExpenseType;
    amount: number;
    expenseDate: Date;
    description: string;
    images?: ExpenseImageDto[];
    createdAt: Date;
    updatedAt?: Date;
}

export interface PaginatedResponse<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// ============================================================
// Request DTOs (sent to backend)
// ============================================================

export interface CreateExpenseDto {
    title: string;
    type: ExpenseType;
    amount: number;
    expenseDate: string;  // ISO date string
    description: string;
}

export interface UpdateExpenseDto {
    title: string;
    type: ExpenseType;
    amount: number;
    expenseDate: string;  // ISO date string
    description: string;
}

export interface CreateExpenseImageDto {
    expenseId: string;
    imageUrl: string;
}

export interface PaginationDto {
    pageNumber?: number;
    pageSize?: number;
}

// ============================================================
// KPI & Statistics DTOs
// ============================================================

export interface TotalExpenseKpiDto {
    totalAmount: number;
    totalExpenseCount: number;
    averageExpense: number;
    maxExpense: number;
    minExpense: number;
    earliestExpenseDate: string | null;
    latestExpenseDate: string | null;
}

export interface MonthlyExpenseDto {
    year: number;
    month: number;
    monthName: string;
    totalAmount: number;
    expenseCount: number;
    averageExpense: number;
}

export interface MonthlyExpensesDto {
    data: MonthlyExpenseDto[];
    totalAmount: number;
    totalExpenseCount: number;
    monthsWithData: number;
}

export interface ExpenseTypeStatsDto {
    type: ExpenseType;
    typeName: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
    percentageOfTotal: number;
}

export interface ExpenseStatsDto {
    data: ExpenseTypeStatsDto[];
    totalAmount: number;
    totalExpenseCount: number;
    highestCategory: ExpenseTypeStatsDto;
    lowestCategory: ExpenseTypeStatsDto;
}
