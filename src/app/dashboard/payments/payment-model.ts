export interface PaymentModel {
    id: string;
    houseId: string;
    residentId: string;
    amount: number;
    paymentDate?: string;
    periodStart: string;
    periodEnd: string;
    status: 'Paid' | 'Pending' | 'Overdue';
}

export interface BudgetStats {
    totalBudget: number;
    collectedAmount: number;
    outstandingAmount: number;
    budgetChangePercentage: number;
}
