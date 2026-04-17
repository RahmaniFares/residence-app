import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    IncidentModel,
    IncidentStatus,
    IncidentPriority,
    IncidentCategory,
    CommentModel,
    CreateIncidentDto,
    UpdateIncidentDto,
    IncidentDto,
    CreateIncidentCommentDto,
    IncidentCommentDto,
    PaginatedResult
} from './incident-model';

@Injectable({
    providedIn: 'root',
})
export class IncidentServices {
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    private incidentsSubject = new BehaviorSubject<IncidentModel[]>([]);
    incidents$ = this.incidentsSubject.asObservable();

    private commentsSubject = new BehaviorSubject<CommentModel[]>([]);
    comments$ = this.commentsSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Load all incidents for the current residence (paginated).
     */
    loadIncidents(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<IncidentDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        this.loadingSubject.next(true);
        return this.http.get<PaginatedResult<IncidentDto>>(
            `${this.apiUrl}/${this.residenceId}/incidents`,
            { params }
        ).pipe(
            tap({
                next: (result) => {
                    const mapped = result.items.map(i => this.mapDtoToModel(i));
                    this.incidentsSubject.next(mapped);
                    this.loadingSubject.next(false);
                },
                error: () => this.loadingSubject.next(false),
                complete: () => this.loadingSubject.next(false)
            })
        );
    }

    /**
     * Get incident by ID.
     */
    getIncidentById(id: string): Observable<IncidentDto> {
        return this.http.get<IncidentDto>(`${this.apiUrl}/${this.residenceId}/incidents/${id}`);
    }

    /**
     * Update incident.
     */
    updateIncident(id: string, incident: UpdateIncidentDto): Observable<IncidentDto> {
        return this.http.put<IncidentDto>(
            `${this.apiUrl}/${this.residenceId}/incidents/${id}`,
            incident
        ).pipe(
            tap(updated => {
                const current = this.incidentsSubject.value;
                const index = current.findIndex(i => i.id === id);
                if (index !== -1) {
                    current[index] = this.mapDtoToModel(updated);
                    this.incidentsSubject.next([...current]);
                }
            })
        );
    }

    /**
     * Report a new incident.
     */
    addIncident(incident: CreateIncidentDto): Observable<IncidentDto> {
        return this.http.post<IncidentDto>(
            `${this.apiUrl}/${this.residenceId}/incidents`,
            incident
        ).pipe(
            tap(newIncident => {
                const current = this.incidentsSubject.value;
                this.incidentsSubject.next([this.mapDtoToModel(newIncident), ...current]);
            })
        );
    }

    /**
     * Delete incident.
     */
    deleteIncident(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${this.residenceId}/incidents/${id}`).pipe(
            tap(() => {
                const current = this.incidentsSubject.value;
                this.incidentsSubject.next(current.filter(i => i.id !== id));
            })
        );
    }

    /**
     * Get incidents by resident (paginated).
     */
    loadIncidentsByResident(residentId: string, pageNumber: number = 1, pageSize: number = 8): Observable<PaginatedResult<IncidentDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedResult<IncidentDto>>(
            `${this.apiUrl}/${this.residenceId}/incidents/resident/${residentId}`,
            { params }
        ).pipe(
            tap(result => {
                const mapped = result.items.map(i => this.mapDtoToModel(i));
                this.incidentsSubject.next(mapped);
            })
        );
    }

    /**
     * Load incident comments (paginated).
     */
    loadComments(incidentId: string, pageNumber: number = 1, pageSize: number = 20): Observable<PaginatedResult<IncidentCommentDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedResult<IncidentCommentDto>>(
            `${this.apiUrl}/${this.residenceId}/incidents/${incidentId}/comments`,
            { params }
        ).pipe(
            tap(result => {
                const mapped = result.items.map(c => this.mapCommentDtoToModel(c));
                this.commentsSubject.next(mapped);
            })
        );
    }

    /**
     * Add comment to incident.
     */
    addComment(incidentId: string, comment: CreateIncidentCommentDto): Observable<IncidentCommentDto> {
        return this.http.post<IncidentCommentDto>(
            `${this.apiUrl}/${this.residenceId}/incidents/${incidentId}/comments`,
            comment
        ).pipe(
            tap(newComment => {
                const current = this.commentsSubject.value;
                this.commentsSubject.next([...current, this.mapCommentDtoToModel(newComment)]);
            })
        );
    }

    /**
     * Mapping helpers
     */
    private mapDtoToModel(dto: IncidentDto): IncidentModel {
        return {
            id: dto.id,
            title: dto.title,
            description: dto.description,
            category: dto.category,
            priority: dto.priority,
            status: dto.status,
            location: dto.location,
            residentId: dto.residentId,
            residentName: dto.reporter,
            dateReported: dto.createdAt.split('T')[0]
        };
    }

    private mapCommentDtoToModel(dto: IncidentCommentDto): CommentModel {
        return {
            id: dto.id,
            incidentId: dto.incidentId,
            author: dto.authorName || 'Anonymous',
            text: dto.text,
            timestamp: new Date(dto.createdAt),
            isCurrentUser: false // This will be handled in UI or based on user identity logic
        };
    }
}
