# Angular Payment Service Implementation Guide

## Overview
This guide provides step-by-step instructions to create an Angular payment service that integrates with the Residence API payment endpoints.

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/residences/{residenceId}/payments` | Create a new payment |
| GET | `/api/residences/{residenceId}/payments/{id}` | Get payment by ID |
| PUT | `/api/residences/{residenceId}/payments/{id}` | Update payment |
| DELETE | `/api/residences/{residenceId}/payments/{id}` | Delete payment |
| GET | `/api/residences/{residenceId}/payments` | Get all payments in residence (paginated) |
| GET | `/api/residences/{residenceId}/payments/resident/{residentId}` | Get resident payments (paginated) |
| GET | `/api/residences/{residenceId}/payments/house/{houseId}` | Get house payments (paginated) |

---

## Step 1: Create DTOs/Models

### payment.model.ts
```typescript
export interface CreatePaymentDto {
  amount: number;
  description?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  // Add other required fields based on your backend requirements
}

export interface UpdatePaymentDto {
  amount: number;
  description?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  // Add other fields that can be updated
}

export interface PaymentDto {
  id: string;
  amount: number;
  description?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  residenceId: string;
  residentId?: string;
  houseId?: string;
  createdAt: Date;
  updatedAt?: Date;
  // Add other fields returned from your backend
}

export interface PaginationDto {
  pageNumber: number;
  pageSize: number;
}

export interface PagedResultDto<T> {
  items: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Step 2: Create the Payment Service

### payment.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CreatePaymentDto, 
  UpdatePaymentDto, 
  PaymentDto, 
  PaginationDto,
  PagedResultDto 
} from './payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = 'api/residences';

  constructor(private http: HttpClient) {}

  /**
   * Create a new payment
   * @param residenceId - The residence ID
   * @param dto - Payment creation data
   * @returns Observable of created payment
   */
  createPayment(residenceId: string, dto: CreatePaymentDto): Observable<PaymentDto> {
    const url = `${this.apiUrl}/${residenceId}/payments`;
    return this.http.post<PaymentDto>(url, dto);
  }

  /**
   * Get payment by ID
   * @param residenceId - The residence ID
   * @param id - The payment ID
   * @returns Observable of payment details
   */
  getPaymentById(residenceId: string, id: string): Observable<PaymentDto> {
    const url = `${this.apiUrl}/${residenceId}/payments/${id}`;
    return this.http.get<PaymentDto>(url);
  }

  /**
   * Update payment
   * @param residenceId - The residence ID
   * @param id - The payment ID
   * @param dto - Updated payment data
   * @returns Observable of updated payment
   */
  updatePayment(residenceId: string, id: string, dto: UpdatePaymentDto): Observable<PaymentDto> {
    const url = `${this.apiUrl}/${residenceId}/payments/${id}`;
    return this.http.put<PaymentDto>(url, dto);
  }

  /**
   * Delete payment
   * @param residenceId - The residence ID
   * @param id - The payment ID
   * @returns Observable of delete operation
   */
  deletePayment(residenceId: string, id: string): Observable<void> {
    const url = `${this.apiUrl}/${residenceId}/payments/${id}`;
    return this.http.delete<void>(url);
  }

  /**
   * Get all payments in residence (paginated)
   * @param residenceId - The residence ID
   * @param pagination - Pagination parameters
   * @returns Observable of paged payment results
   */
  getPaymentsByResidence(
    residenceId: string, 
    pagination: PaginationDto
  ): Observable<PagedResultDto<PaymentDto>> {
    const url = `${this.apiUrl}/${residenceId}/payments`;
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResultDto<PaymentDto>>(url, { params });
  }

  /**
   * Get payments by resident (paginated)
   * @param residenceId - The residence ID
   * @param residentId - The resident ID
   * @param pagination - Pagination parameters
   * @returns Observable of paged payment results for the resident
   */
  getPaymentsByResident(
    residenceId: string, 
    residentId: string,
    pagination: PaginationDto
  ): Observable<PagedResultDto<PaymentDto>> {
    const url = `${this.apiUrl}/${residenceId}/payments/resident/${residentId}`;
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResultDto<PaymentDto>>(url, { params });
  }

  /**
   * Get payments by house (paginated)
   * @param residenceId - The residence ID
   * @param houseId - The house ID
   * @param pagination - Pagination parameters
   * @returns Observable of paged payment results for the house
   */
  getPaymentsByHouse(
    residenceId: string, 
    houseId: string,
    pagination: PaginationDto
  ): Observable<PagedResultDto<PaymentDto>> {
    const url = `${this.apiUrl}/${residenceId}/payments/house/${houseId}`;
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResultDto<PaymentDto>>(url, { params });
  }

  /**
   * Helper method to build pagination parameters
   */
  private buildPaginationParams(pagination: PaginationDto): HttpParams {
    return new HttpParams()
      .set('pageNumber', pagination.pageNumber.toString())
      .set('pageSize', pagination.pageSize.toString());
  }
}
```

---

## Step 3: Create a Payment Component (Example)

### payment-list.component.ts
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaymentService } from './payment.service';
import { PaymentDto, PaginationDto, PagedResultDto } from './payment.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit, OnDestroy {
  payments: PaymentDto[] = [];
  loading = false;
  error: string | null = null;

  residenceId = ''; // Set this based on your context
  pagination: PaginationDto = { pageNumber: 1, pageSize: 10 };
  totalPages = 0;
  totalPayments = 0;

  private destroy$ = new Subject<void>();

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayments(): void {
    if (!this.residenceId) {
      this.error = 'Residence ID is required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.paymentService
      .getPaymentsByResidence(this.residenceId, this.pagination)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResultDto<PaymentDto>) => {
          this.payments = result.items;
          this.totalPages = result.totalPages;
          this.totalPayments = result.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load payments';
          console.error(err);
          this.loading = false;
        }
      });
  }

  changePage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.pagination.pageNumber = pageNumber;
      this.loadPayments();
    }
  }

  deletePayment(id: string): void {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.paymentService
        .deletePayment(this.residenceId, id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.payments = this.payments.filter(p => p.id !== id);
            this.totalPayments--;
          },
          error: (err) => {
            this.error = 'Failed to delete payment';
            console.error(err);
          }
        });
    }
  }
}
```

### payment-list.component.html
```html
<div class="payment-container">
  <h2>Payments</h2>

  <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
    {{ error }}
    <button type="button" class="btn-close" (click)="error = null"></button>
  </div>

  <div *ngIf="loading" class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>

  <div *ngIf="!loading && payments.length > 0">
    <p class="text-muted">Total Payments: {{ totalPayments }}</p>

    <table class="table table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th>Payment ID</th>
          <th>Amount</th>
          <th>Description</th>
          <th>Payment Date</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let payment of payments">
          <td>{{ payment.id | slice:0:8 }}...</td>
          <td><strong>${{ payment.amount | number:'1.2-2' }}</strong></td>
          <td>{{ payment.description || 'N/A' }}</td>
          <td>{{ payment.paymentDate | date:'short' || 'N/A' }}</td>
          <td>{{ payment.createdAt | date:'medium' }}</td>
          <td>
            <button 
              (click)="deletePayment(payment.id)" 
              class="btn btn-danger btn-sm"
              [disabled]="loading">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p *ngIf="!loading && payments.length === 0" class="alert alert-info">
    No payments found.
  </p>

  <!-- Pagination -->
  <nav *ngIf="totalPages > 1" aria-label="Pagination">
    <ul class="pagination justify-content-center">
      <li class="page-item" [class.disabled]="pagination.pageNumber === 1">
        <button 
          class="page-link" 
          (click)="changePage(pagination.pageNumber - 1)"
          [disabled]="pagination.pageNumber === 1">
          Previous
        </button>
      </li>
      <li 
        class="page-item"
        *ngFor="let page of [].constructor(totalPages); let i = index"
        [class.active]="pagination.pageNumber === i + 1">
        <button 
          class="page-link"
          (click)="changePage(i + 1)">
          {{ i + 1 }}
        </button>
      </li>
      <li class="page-item" [class.disabled]="pagination.pageNumber === totalPages">
        <button 
          class="page-link"
          (click)="changePage(pagination.pageNumber + 1)"
          [disabled]="pagination.pageNumber === totalPages">
          Next
        </button>
      </li>
    </ul>
  </nav>
</div>
```

### payment-list.component.css
```css
.payment-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.payment-container h2 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.alert {
  margin-bottom: 20px;
}

.spinner-border {
  margin: 20px 0;
}

.table {
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table th {
  font-weight: 600;
  color: #fff;
}

.table tbody tr:hover {
  background-color: #f5f5f5;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.pagination {
  margin-top: 20px;
}

.page-link {
  cursor: pointer;
}

.page-link:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

---

## Step 4: Register Service in Module

### app.module.ts
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { PaymentListComponent } from './payments/payment-list.component';
import { PaymentService } from './payments/payment.service';

@NgModule({
  declarations: [
    AppComponent,
    PaymentListComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CommonModule,
    FormsModule
  ],
  providers: [PaymentService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## Step 5: Usage Examples

### Create Payment
```typescript
const newPayment: CreatePaymentDto = {
  amount: 500,
  description: 'Monthly rent',
  paymentDate: new Date(),
  paymentMethod: 'credit_card'
};

this.paymentService.createPayment(residenceId, newPayment).subscribe({
  next: (payment) => {
    console.log('Payment created:', payment);
    // Refresh the list or show success message
  },
  error: (error) => {
    console.error('Error creating payment:', error);
    // Show error message to user
  }
});
```

### Update Payment
```typescript
const updatedPayment: UpdatePaymentDto = {
  amount: 550,
  description: 'Monthly rent - Updated',
  paymentDate: new Date(),
  paymentMethod: 'bank_transfer'
};

this.paymentService.updatePayment(residenceId, paymentId, updatedPayment).subscribe({
  next: (payment) => {
    console.log('Payment updated:', payment);
  },
  error: (error) => {
    console.error('Error updating payment:', error);
  }
});
```

### Get Payments by Resident
```typescript
const pagination: PaginationDto = { pageNumber: 1, pageSize: 20 };

this.paymentService.getPaymentsByResident(residenceId, residentId, pagination).subscribe({
  next: (result) => {
    console.log('Resident payments:', result.items);
    console.log('Total payments:', result.total);
    console.log('Total pages:', result.totalPages);
  },
  error: (error) => {
    console.error('Error fetching payments:', error);
  }
});
```

### Get Payments by House
```typescript
const pagination: PaginationDto = { pageNumber: 1, pageSize: 15 };

this.paymentService.getPaymentsByHouse(residenceId, houseId, pagination).subscribe({
  next: (result) => {
    console.log('House payments:', result.items);
  },
  error: (error) => {
    console.error('Error fetching house payments:', error);
  }
});
```

---

## Step 6: Configuration Setup

### environment.ts
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000' // Match your API URL
};
```

### Update payment.service.ts with environment
```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/api/residences`;

  // ... rest of the service
}
```

---

## Best Practices

✅ **Type Safety**: Always use TypeScript interfaces for strong typing  
✅ **Error Handling**: Implement proper error handling with user-friendly messages  
✅ **Pagination**: Always use pagination for list endpoints to manage large datasets  
✅ **HttpClient**: Ensure `HttpClientModule` is imported in your module  
✅ **Unsubscribe**: Use `takeUntil` operator to prevent memory leaks  
✅ **Loading States**: Show loading indicators during async operations  
✅ **User Feedback**: Display success/error messages for all operations  
✅ **Validation**: Validate form inputs before sending to API  

---

## Optional Enhancements

### Add HTTP Interceptor for Authentication
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(req);
  }
}
```

### Add State Management with NgRx (Optional)
For complex scenarios with multiple components accessing payment data, consider implementing NgRx for centralized state management.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS errors** | Configure CORS on your backend or use a proxy |
| **401 Unauthorized** | Check authentication token validity |
| **404 Not Found** | Verify residenceId, paymentId, residentId, houseId are correct |
| **500 Server Error** | Check backend logs for detailed error information |
| **Slow pagination** | Reduce pageSize or implement server-side filtering |

---

## Next Steps

1. ✓ Define all fields in `PaymentDto` models based on your backend entity
2. ✓ Test each endpoint individually using Postman or similar tool
3. ✓ Implement additional filtering and sorting capabilities
4. ✓ Add form validation for create/update operations
5. ✓ Implement caching strategies for frequently accessed data
6. ✓ Add unit tests for the service and components
7. ✓ Consider implementing a payment history/details view