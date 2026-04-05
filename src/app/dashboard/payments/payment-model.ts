export enum PaymentStatus {
    Pending = 0,
    Paid = 1,
    Overdue = 2
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
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePaymentDto {
    amount: number;
    houseId: string;
    residentId: string;
    periodStart: string;
    periodEnd: string;
    paymentDate?: string;
    status: PaymentStatus;
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
