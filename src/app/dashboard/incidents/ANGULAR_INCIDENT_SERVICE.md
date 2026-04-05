# Angular Incident Service Implementation Guide

## Overview
This guide provides step-by-step instructions to create an Angular incident service that integrates with the Residence API incident endpoints. The service handles incident reporting, management, and comment threading.

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/residences/{residenceId}/incidents` | Report a new incident |
| GET | `/api/residences/{residenceId}/incidents/{id}` | Get incident by ID |
| PUT | `/api/residences/{residenceId}/incidents/{id}` | Update incident |
| DELETE | `/api/residences/{residenceId}/incidents/{id}` | Delete incident |
| GET | `/api/residences/{residenceId}/incidents` | Get all incidents (paginated) |
| GET | `/api/residences/{residenceId}/incidents/resident/{residentId}` | Get resident's incidents (paginated) |
| POST | `/api/residences/{residenceId}/incidents/{incidentId}/comments` | Add comment to incident |
| GET | `/api/residences/{residenceId}/incidents/{incidentId}/comments` | Get incident comments (paginated) |

---

## Step 1: Create DTOs/Models

### incident.model.ts
```typescript
export enum IncidentStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Resolved = 'Resolved',
  Closed = 'Closed'
}

export enum IncidentPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum IncidentCategory {
  Maintenance = 'Maintenance',
  Safety = 'Safety',
  Noise = 'Noise',
  Cleaning = 'Cleaning',
  Other = 'Other'
}

export interface CreateIncidentDto {
  title: string;
  description: string;
  category: IncidentCategory;
  priority?: IncidentPriority;
  location?: string;
  residentId?: string;
}

export interface UpdateIncidentDto {
  title: string;
  description: string;
  category: IncidentCategory;
  priority?: IncidentPriority;
  location?: string;
  status?: IncidentStatus;
}

export interface IncidentDto {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  location?: string;
  residenceId: string;
  residentId?: string;
  reporter?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateIncidentCommentDto {
  content: string;
  attachmentUrl?: string;
}

export interface IncidentCommentDto {
  id: string;
  incidentId: string;
  content: string;
  authorId: string;
  authorName?: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
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

## Step 2: Create the Incident Service

### incident.service.ts
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CreateIncidentDto, 
  UpdateIncidentDto, 
  IncidentDto,
  CreateIncidentCommentDto,
  IncidentCommentDto,
  PaginationDto,
  PagedResultDto 
} from './incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private readonly apiUrl = 'api/residences';

  constructor(private http: HttpClient) {}

  /**
   * Report a new incident
   * @param residenceId - The residence ID
   * @param dto - Incident creation data
   * @returns Observable of created incident
   */
  createIncident(residenceId: string, dto: CreateIncidentDto): Observable<IncidentDto> {
    const url = `${this.apiUrl}/${residenceId}/incidents`;
    return this.http.post<IncidentDto>(url, dto);
  }

  /**
   * Get incident by ID
   * @param residenceId - The residence ID
   * @param id - The incident ID
   * @returns Observable of incident details
   */
  getIncidentById(residenceId: string, id: string): Observable<IncidentDto> {
    const url = `${this.apiUrl}/${residenceId}/incidents/${id}`;
    return this.http.get<IncidentDto>(url);
  }

  /**
   * Update incident
   * @param residenceId - The residence ID
   * @param id - The incident ID
   * @param dto - Updated incident data
   * @returns Observable of updated incident
   */
  updateIncident(residenceId: string, id: string, dto: UpdateIncidentDto): Observable<IncidentDto> {
    const url = `${this.apiUrl}/${residenceId}/incidents/${id}`;
    return this.http.put<IncidentDto>(url, dto);
  }

  /**
   * Delete incident
   * @param residenceId - The residence ID
   * @param id - The incident ID
   * @returns Observable of delete operation
   */
  deleteIncident(residenceId: string, id: string): Observable<void> {
    const url = `${this.apiUrl}/${residenceId}/incidents/${id}`;
    return this.http.delete<void>(url);
  }

  /**
   * Get all incidents in residence (paginated)
   * @param residenceId - The residence ID
   * @param pagination - Pagination parameters
   * @returns Observable of paged incident results
   */
  getIncidentsByResidence(
    residenceId: string, 
    pagination: PaginationDto
  ): Observable<PagedResultDto<IncidentDto>> {
    const url = `${this.apiUrl}/${residenceId}/incidents`;
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResultDto<IncidentDto>>(url, { params });
  }

  /**
   * Get incidents by resident (paginated)
   * @param residenceId - The residence ID
   * @param residentId - The resident ID
   * @param pagination - Pagination parameters
   * @returns Observable of paged incident results for the resident
   */
  getIncidentsByResident(
    residenceId: string, 
    residentId: string,
    pagination: PaginationDto
  ): Observable<PagedResultDto<IncidentDto>> {
    const url = `${this.apiUrl}/${residenceId}/incidents/resident/${residentId}`;
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResultDto<IncidentDto>>(url, { params });
  }

  /**
   * Add comment to incident
   * @param residenceId - The residence ID
   * @param incidentId - The incident ID
   * @param dto - Comment data
   * @returns Observable of created comment
   */
  addCommentToIncident(
    residenceId: string,
    incidentId: string,
    dto: CreateIncidentCommentDto
  ): Observable<IncidentCommentDto> {
    const url = `${this.apiUrl}/${residenceId}/incidents/${incidentId}/comments`;
    return this.http.post<IncidentCommentDto>(url, dto);
  }

  /**
   * Get incident comments (paginated)
   * @param residenceId - The residence ID
   * @param incidentId - The incident ID
   * @param pagination - Pagination parameters
   * @returns Observable of paged comment results
   */
  getIncidentComments(
    residenceId: string,
    incidentId: string,
    pagination: PaginationDto
  ): Observable<PagedResultDto<IncidentCommentDto>> {
    const url = `${this.apiUrl}/${residenceId}/incidents/${incidentId}/comments`;
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResultDto<IncidentCommentDto>>(url, { params });
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

## Step 3: Create Incident Components

### 3.1 Incident List Component

#### incident-list.component.ts
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IncidentService } from './incident.service';
import { IncidentDto, PaginationDto, PagedResultDto, IncidentStatus } from './incident.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-incident-list',
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.css']
})
export class IncidentListComponent implements OnInit, OnDestroy {
  incidents: IncidentDto[] = [];
  loading = false;
  error: string | null = null;
  
  residenceId = ''; // Set based on your context
  residentId: string | null = null; // Optional filter
  pagination: PaginationDto = { pageNumber: 1, pageSize: 10 };
  totalPages = 0;
  totalIncidents = 0;

  statusColors: { [key: string]: string } = {
    'Open': 'badge-danger',
    'InProgress': 'badge-warning',
    'Resolved': 'badge-info',
    'Closed': 'badge-success'
  };

  private destroy$ = new Subject<void>();

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadIncidents(): void {
    if (!this.residenceId) {
      this.error = 'Residence ID is required';
      return;
    }

    this.loading = true;
    this.error = null;

    const request$ = this.residentId
      ? this.incidentService.getIncidentsByResident(this.residenceId, this.residentId, this.pagination)
      : this.incidentService.getIncidentsByResidence(this.residenceId, this.pagination);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResultDto<IncidentDto>) => {
          this.incidents = result.items;
          this.totalPages = result.totalPages;
          this.totalIncidents = result.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load incidents';
          console.error(err);
          this.loading = false;
        }
      });
  }

  changePage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.pagination.pageNumber = pageNumber;
      this.loadIncidents();
    }
  }

  deleteIncident(id: string): void {
    if (confirm('Are you sure you want to delete this incident?')) {
      this.incidentService
        .deleteIncident(this.residenceId, id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.incidents = this.incidents.filter(i => i.id !== id);
            this.totalIncidents--;
          },
          error: (err) => {
            this.error = 'Failed to delete incident';
            console.error(err);
          }
        });
    }
  }

  getStatusBadgeClass(status: IncidentStatus): string {
    return this.statusColors[status] || 'badge-secondary';
  }
}
```

#### incident-list.component.html
```html
<div class="incident-container">
  <div class="incident-header">
    <h2>Incidents</h2>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#reportIncidentModal">
      Report Incident
    </button>
  </div>

  <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
    {{ error }}
    <button type="button" class="btn-close" (click)="error = null"></button>
  </div>

  <div *ngIf="loading" class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>

  <div *ngIf="!loading && incidents.length > 0">
    <p class="text-muted">Total Incidents: {{ totalIncidents }}</p>
    
    <div class="incident-list">
      <div class="incident-card" *ngFor="let incident of incidents">
        <div class="incident-header-card">
          <h5>{{ incident.title }}</h5>
          <span [class]="'badge ' + getStatusBadgeClass(incident.status)">
            {{ incident.status }}
          </span>
        </div>
        
        <p class="incident-description">{{ incident.description }}</p>
        
        <div class="incident-meta">
          <span class="badge bg-light text-dark">{{ incident.category }}</span>
          <span class="badge" [class.bg-danger]="incident.priority === 'Critical'"
                             [class.bg-warning]="incident.priority === 'High'"
                             [class.bg-info]="incident.priority === 'Medium'"
                             [class.bg-secondary]="incident.priority === 'Low'">
            {{ incident.priority }}
          </span>
          <small class="text-muted">{{ incident.createdAt | date:'short' }}</small>
        </div>

        <div class="incident-location" *ngIf="incident.location">
          <small><strong>Location:</strong> {{ incident.location }}</small>
        </div>

        <div class="incident-actions">
          <button class="btn btn-sm btn-info" (click)="viewIncident(incident.id)">
            View Details
          </button>
          <button class="btn btn-sm btn-warning" (click)="editIncident(incident.id)">
            Edit
          </button>
          <button class="btn btn-sm btn-danger" (click)="deleteIncident(incident.id)" [disabled]="loading">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>

  <p *ngIf="!loading && incidents.length === 0" class="alert alert-info">
    No incidents found.
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

#### incident-list.component.css
```css
.incident-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.incident-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.incident-header h2 {
  margin: 0;
  color: #333;
}

.incident-list {
  display: grid;
  gap: 15px;
  margin: 20px 0;
}

.incident-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.3s ease;
}

.incident-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.incident-header-card {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.incident-header-card h5 {
  margin: 0;
  color: #333;
  flex: 1;
}

.incident-description {
  color: #666;
  margin: 10px 0;
  line-height: 1.5;
}

.incident-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin: 10px 0;
}

.incident-location {
  margin: 10px 0;
  color: #666;
}

.incident-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.alert {
  margin-bottom: 20px;
}

.badge {
  font-size: 0.85rem;
  padding: 0.35rem 0.65rem;
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

### 3.2 Incident Detail Component

#### incident-detail.component.ts
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IncidentService } from './incident.service';
import { IncidentDto, IncidentCommentDto, CreateIncidentCommentDto, PaginationDto } from './incident.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-incident-detail',
  templateUrl: './incident-detail.component.html',
  styleUrls: ['./incident-detail.component.css']
})
export class IncidentDetailComponent implements OnInit, OnDestroy {
  incident: IncidentDto | null = null;
  comments: IncidentCommentDto[] = [];
  newComment: CreateIncidentCommentDto = { content: '' };
  
  loading = false;
  commentsLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  residenceId = '';
  incidentId = '';
  commentsPagination: PaginationDto = { pageNumber: 1, pageSize: 10 };
  commentsTotalPages = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private incidentService: IncidentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.residenceId = this.route.snapshot.paramMap.get('residenceId') || '';
    this.incidentId = this.route.snapshot.paramMap.get('incidentId') || '';
    
    this.loadIncidentDetail();
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadIncidentDetail(): void {
    if (!this.residenceId || !this.incidentId) {
      this.error = 'Required parameters missing';
      return;
    }

    this.loading = true;
    this.error = null;

    this.incidentService
      .getIncidentById(this.residenceId, this.incidentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (incident) => {
          this.incident = incident;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load incident details';
          console.error(err);
          this.loading = false;
        }
      });
  }

  loadComments(): void {
    this.commentsLoading = true;

    this.incidentService
      .getIncidentComments(this.residenceId, this.incidentId, this.commentsPagination)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.comments = result.items;
          this.commentsTotalPages = result.totalPages;
          this.commentsLoading = false;
        },
        error: (err) => {
          console.error('Failed to load comments', err);
          this.commentsLoading = false;
        }
      });
  }

  addComment(): void {
    if (!this.newComment.content.trim()) {
      this.error = 'Comment cannot be empty';
      return;
    }

    this.incidentService
      .addCommentToIncident(this.residenceId, this.incidentId, this.newComment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comment) => {
          this.comments.unshift(comment);
          this.newComment = { content: '' };
          this.successMessage = 'Comment added successfully';
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.error = 'Failed to add comment';
          console.error(err);
        }
      });
  }

  changeCommentsPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.commentsTotalPages) {
      this.commentsPagination.pageNumber = pageNumber;
      this.loadComments();
    }
  }
}
```

#### incident-detail.component.html
```html
<div class="incident-detail-container" *ngIf="incident">
  <div class="incident-header">
    <h2>{{ incident.title }}</h2>
    <span [class]="'badge badge-lg ' + getStatusBadgeClass(incident.status)">
      {{ incident.status }}
    </span>
  </div>

  <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
    {{ error }}
    <button type="button" class="btn-close" (click)="error = null"></button>
  </div>

  <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show">
    {{ successMessage }}
    <button type="button" class="btn-close" (click)="successMessage = null"></button>
  </div>

  <div class="incident-details">
    <div class="detail-row">
      <label>Category:</label>
      <span>{{ incident.category }}</span>
    </div>
    <div class="detail-row">
      <label>Priority:</label>
      <span [class]="'badge ' + getPriorityClass(incident.priority)">{{ incident.priority }}</span>
    </div>
    <div class="detail-row">
      <label>Location:</label>
      <span>{{ incident.location || 'Not specified' }}</span>
    </div>
    <div class="detail-row">
      <label>Reporter:</label>
      <span>{{ incident.reporter || 'Anonymous' }}</span>
    </div>
    <div class="detail-row">
      <label>Created:</label>
      <span>{{ incident.createdAt | date:'medium' }}</span>
    </div>
  </div>

  <div class="incident-description">
    <h4>Description</h4>
    <p>{{ incident.description }}</p>
  </div>

  <!-- Comments Section -->
  <div class="comments-section">
    <h4>Comments ({{ comments.length }})</h4>

    <div class="add-comment">
      <textarea 
        [(ngModel)]="newComment.content"
        placeholder="Add a comment..."
        rows="3"
        class="form-control"></textarea>
      <button 
        (click)="addComment()" 
        class="btn btn-primary btn-sm mt-2"
        [disabled]="commentsLoading">
        Post Comment
      </button>
    </div>

    <div *ngIf="commentsLoading" class="spinner-border spinner-border-sm text-primary">
      <span class="visually-hidden">Loading comments...</span>
    </div>

    <div class="comments-list">
      <div class="comment" *ngFor="let comment of comments">
        <div class="comment-header">
          <strong>{{ comment.authorName || 'Anonymous' }}</strong>
          <small class="text-muted">{{ comment.createdAt | date:'short' }}</small>
        </div>
        <p class="comment-content">{{ comment.content }}</p>
        <div *ngIf="comment.attachmentUrl" class="comment-attachment">
          <a [href]="comment.attachmentUrl" target="_blank">View Attachment</a>
        </div>
      </div>
    </div>

    <!-- Comments Pagination -->
    <nav *ngIf="commentsTotalPages > 1">
      <ul class="pagination pagination-sm justify-content-center">
        <li class="page-item" [class.disabled]="commentsPagination.pageNumber === 1">
          <button 
            class="page-link"
            (click)="changeCommentsPage(commentsPagination.pageNumber - 1)"
            [disabled]="commentsPagination.pageNumber === 1">
            Previous
          </button>
        </li>
        <li 
          class="page-item"
          *ngFor="let page of [].constructor(commentsTotalPages); let i = index"
          [class.active]="commentsPagination.pageNumber === i + 1">
          <button 
            class="page-link"
            (click)="changeCommentsPage(i + 1)">
            {{ i + 1 }}
          </button>
        </li>
        <li class="page-item" [class.disabled]="commentsPagination.pageNumber === commentsTotalPages">
          <button 
            class="page-link"
            (click)="changeCommentsPage(commentsPagination.pageNumber + 1)"
            [disabled]="commentsPagination.pageNumber === commentsTotalPages">
            Next
          </button>
        </li>
      </ul>
    </nav>
  </div>
</div>

<div *ngIf="loading" class="text-center">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>
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
import { IncidentListComponent } from './incidents/incident-list.component';
import { IncidentDetailComponent } from './incidents/incident-detail.component';
import { IncidentService } from './incidents/incident.service';

@NgModule({
  declarations: [
    AppComponent,
    IncidentListComponent,
    IncidentDetailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CommonModule,
    FormsModule
  ],
  providers: [IncidentService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## Step 5: Usage Examples

### Report an Incident
```typescript
const newIncident: CreateIncidentDto = {
  title: 'Broken Door Lock',
  description: 'The main entrance door lock is broken and needs immediate repair',
  category: 'Maintenance',
  priority: 'High',
  location: 'Front Entrance',
  residentId: residentsId
};

this.incidentService.createIncident(residenceId, newIncident).subscribe({
  next: (incident) => {
    console.log('Incident reported:', incident);
    this.loadIncidents(); // Refresh list
  },
  error: (error) => {
    console.error('Error reporting incident:', error);
  }
});
```

### Update Incident Status
```typescript
const updateData: UpdateIncidentDto = {
  title: 'Broken Door Lock',
  description: 'The main entrance door lock is broken and needs immediate repair',
  category: 'Maintenance',
  priority: 'High',
  location: 'Front Entrance',
  status: 'InProgress'
};

this.incidentService.updateIncident(residenceId, incidentId, updateData).subscribe({
  next: (incident) => {
    console.log('Incident updated:', incident);
  },
  error: (error) => {
    console.error('Error updating incident:', error);
  }
});
```

### Get Resident's Incidents
```typescript
const pagination: PaginationDto = { pageNumber: 1, pageSize: 20 };

this.incidentService.getIncidentsByResident(residenceId, residentId, pagination).subscribe({
  next: (result) => {
    console.log('Resident incidents:', result.items);
    console.log('Total incidents:', result.total);
  },
  error: (error) => {
    console.error('Error fetching incidents:', error);
  }
});
```

### Add Comment to Incident
```typescript
const comment: CreateIncidentCommentDto = {
  content: 'The maintenance team has been notified and will arrive within 24 hours.',
  attachmentUrl: 'https://example.com/images/photo.jpg' // Optional
};

this.incidentService.addCommentToIncident(residenceId, incidentId, comment).subscribe({
  next: (addedComment) => {
    console.log('Comment added:', addedComment);
    this.loadComments(); // Refresh comments
  },
  error: (error) => {
    console.error('Error adding comment:', error);
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

### Update incident.service.ts with environment
```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private readonly apiUrl = `${environment.apiUrl}/api/residences`;
  
  // ... rest of the service
}
```

---

## Best Practices

✅ **Type Safety**: Use TypeScript enums for status and priority values  
✅ **Error Handling**: Implement proper error handling with user-friendly messages  
✅ **Pagination**: Always use pagination for list endpoints  
✅ **HttpClient**: Ensure `HttpClientModule` is imported in your module  
✅ **Memory Management**: Use `takeUntil` operator to prevent memory leaks  
✅ **Loading States**: Show loading indicators during async operations  
✅ **User Feedback**: Display success/error messages for all operations  
✅ **Comment Threading**: Maintain comment order and allow nested responses  
✅ **Validation**: Validate form inputs before sending to API  

---

## Routing Configuration

### app-routing.module.ts
```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IncidentListComponent } from './incidents/incident-list.component';
import { IncidentDetailComponent } from './incidents/incident-detail.component';

const routes: Routes = [
  {
    path: 'residences/:residenceId/incidents',
    children: [
      { path: '', component: IncidentListComponent },
      { path: ':incidentId', component: IncidentDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

---

## Optional Enhancements

### Add Real-time Updates with SignalR
For live incident updates across multiple users, consider implementing SignalR:
```typescript
// incident-signalr.service.ts
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@aspnetcore/signalr';

@Injectable({
  providedIn: 'root'
})
export class IncidentSignalRService {
  private hubConnection: HubConnection;

  constructor() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('/incidentHub')
      .withAutomaticReconnect()
      .build();
  }

  startConnection(): Promise<void> {
    return this.hubConnection.start();
  }

  onIncidentUpdated(callback: (incident: any) => void): void {
    this.hubConnection.on('IncidentUpdated', callback);
  }
}
```

### Add Filtering and Sorting
```typescript
export interface IncidentFilterDto {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  category?: IncidentCategory;
  searchTerm?: string;
}

getIncidentsByResidenceFiltered(
  residenceId: string,
  filter: IncidentFilterDto,
  pagination: PaginationDto
): Observable<PagedResultDto<IncidentDto>> {
  let params = this.buildPaginationParams(pagination);
  
  if (filter.status) params = params.set('status', filter.status);
  if (filter.priority) params = params.set('priority', filter.priority);
  if (filter.category) params = params.set('category', filter.category);
  if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
  
  return this.http.get<PagedResultDto<IncidentDto>>(
    `${this.apiUrl}/${residenceId}/incidents`,
    { params }
  );
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS errors** | Configure CORS on backend or use proxy |
| **401 Unauthorized** | Check authentication token validity |
| **Comments not loading** | Verify incident ID is correct |
| **Comment upload fails** | Check attachment URL format and permissions |
| **Pagination not working** | Ensure pageNumber and pageSize are positive integers |
| **Real-time updates not working** | Check SignalR hub connection and network |
| **Status changes not reflected** | Refresh component data after update |

---

## Next Steps

1. ✓ Define all fields in DTOs based on your backend entity
2. ✓ Implement incident status workflow (Open → InProgress → Resolved → Closed)
3. ✓ Add image/file upload for incident details and comments
4. ✓ Implement real-time notifications for incident updates
5. ✓ Add filtering by status, priority, and category
6. ✓ Create dashboard showing incident statistics
7. ✓ Add assignment feature to assign incidents to staff
8. ✓ Implement priority-based sorting and alerts
9. ✓ Add unit tests for service and components
10. ✓ Consider implementing audit trail for incident changes
