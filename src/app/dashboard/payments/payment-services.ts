import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PaymentModel } from './payment-model';

@Injectable({
    providedIn: 'root',
})
export class PaymentServices {
    private paymentsSubject = new BehaviorSubject<PaymentModel[]>([
        {
            id: 'PAY-1001',
            houseId: '1',
            residentId: 'RES-1001',
            amount: 450.00,
            paymentDate: '2024-01-15',
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
            status: 'Paid'
        },
        {
            id: 'PAY-1002',
            houseId: '4',
            residentId: 'RES-1002',
            amount: 150.00,
            paymentDate: '2024-02-10',
            periodStart: '2024-02-01',
            periodEnd: '2024-02-29',
            status: 'Paid'
        },
        {
            id: 'PAY-1003',
            houseId: '1',
            residentId: 'RES-1001',
            amount: 150.00,
            paymentDate: '2024-02-01',
            periodStart: '2024-04-01',
            periodEnd: '2024-04-30',
            status: 'Pending'
        },
        {
            id: 'PAY-1004',
            houseId: '4',
            residentId: 'RES-1002',
            amount: 300.00,
            paymentDate: '2024-02-01',
            periodStart: '2024-03-01',
            periodEnd: '2024-04-30',
            status: 'Overdue'
        },
        {
            id: 'PAY-1005',
            houseId: '6',
            residentId: 'RES-1005',
            amount: 1500.00,
            paymentDate: '2024-01-01',
            periodStart: '2024-01-01',
            periodEnd: '2024-12-31',
            status: 'Paid'
        }
    ]);

    payments$ = this.paymentsSubject.asObservable();

    addPayment(payment: PaymentModel) {
        const current = this.paymentsSubject.value;
        this.paymentsSubject.next([...current, payment]);
    }

    getBudgetOverview() {
        return {
            totalBudget: 45250.00,
            collectedAmount: 12840.00,
            outstandingAmount: 3150.00,
            budgetChangePercentage: 12
        };
    }
}
