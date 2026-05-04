export enum PaymentStatus {
    Pending = 0,
    Paid = 1,
    Overdue = 2
}

export enum PaymentMethod {
    Cash = 0,
    Transfer = 1,
    Card = 2,
    Cheque = 3
}

/** One line in a payment: tracks a range of months and the tarif that applied. */
export interface PaymentLineDto {
    fromMonth: number;  // 1–12
    fromYear: number;
    toMonth: number;    // 1–12
    toYear: number;
    tarif: number;      // amount per month for this range
}

export interface PaymentModel {
    id: string;
    houseId: string;
    residentId: string;
    amount: number;
    paymentDate?: string;
    periodStart: string;
    periodEnd: string;
    status: PaymentStatus;
    lines?: PaymentLineDto[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePaymentDto {
    houseId: string;
    residentId: string;
    amount: number;
    method: PaymentMethod;
    periodStart: string;   // ISO date string
    periodEnd: string;
    paymentDate?: string;
    notes?: string;
    lines: PaymentLineDto[];
}

export interface UpdatePaymentDto {
    amount?: number;
    periodStart?: string;
    periodEnd?: string;
    paymentDate?: string;
    status?: PaymentStatus;
}

export interface PaymentDto {
    id: string;
    amount: number;
    paymentDate?: string;
    periodStart: string;
    periodEnd: string;
    status: PaymentStatus;
    residenceId: string;
    residentId: string;
    houseId: string;
    lines?: PaymentLineDto[];
    createdAt: string;
    updatedAt?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface BudgetStats {
    totalBudget: number;
    collectedAmount: number;
    outstandingAmount: number;
    budgetChangePercentage: number;
}

