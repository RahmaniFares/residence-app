import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { CommonModule } from '@angular/common';
import { IncidentServices } from '../incidents/incident-services';
import { IncidentModel, IncidentStatus, CommentModel } from '../incidents/incident-model';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ResidentServices } from '../residents/resident-services';
import { switchMap, of, tap } from 'rxjs';

@Component({
  selector: 'app-incident-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-details.html',
  styleUrl: './incident-details.css',
})
export class IncidentDetails implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  incidentService = inject(IncidentServices);
  residentService = inject(ResidentServices);
  toastr = inject(ToastrService);

  incident = signal<IncidentModel | undefined>(undefined);
  comments = signal<CommentModel[]>([]);
  newCommentText = signal('');
  isLoading = signal(false);

  IncidentStatus = IncidentStatus;

  getCategoryLabel(category: number): string {
    const labels: { [key: number]: string } = {
      0: 'Plomberie',
      1: 'Électricité',
      2: 'Sécurité',
      3: 'Climatisation / Chauffage',
      4: 'Ascenseur',
      5: 'Autre'
    };
    return labels[category] || 'Inconnu';
  }

  getPriorityLabel(priority: number): string {
    const labels: { [key: number]: string } = {
      0: 'Basse',
      1: 'Moyenne',
      2: 'Haute',
      3: 'Critique'
    };
    return labels[priority] || 'Inconnu';
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadIncident(id);
        this.loadComments(id);
      }
    });
  }

  loadIncident(id: string) {
    this.isLoading.set(true);
    this.incidentService.getIncidentById(id).pipe(
      switchMap(dto => {
        // Set initial incident data from DTO
        const incidentData: IncidentModel = {
          id: dto.id,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          priority: dto.priority,
          status: dto.status,
          location: dto.location,
          residentId: dto.residentId,
          residentName: dto.reporter || 'Anonymous',
          dateReported: dto.createdAt.split('T')[0]
        };
        this.incident.set(incidentData);

        // If we have a residentId, fetch full resident details to get correct name
        if (dto.residentId) {
          return this.residentService.getResidentByIdFromApi(dto.residentId).pipe(
            tap(resident => {
              this.incident.update(prev => prev ? {
                ...prev,
                residentName: `${resident.firstName} ${resident.lastName}`
              } : undefined);
            })
          );
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load incident or resident details:', err);
        this.toastr.error('Failed to load incident details');
        this.isLoading.set(false);
      }
    });
  }

  loadComments(incidentId: string) {
    this.incidentService.loadComments(incidentId).subscribe({
      next: (result) => {
        const mapped = result.items.map(c => ({
          id: c.id,
          incidentId: c.incidentId,
          author: c.authorName || 'Résident',
          text: c.text,
          timestamp: new Date(c.createdAt),
          isCurrentUser: false
        }));
        this.comments.set(mapped);

        // Enhance author names by fetching resident details
        result.items.forEach(c => {
          if (c.authorId) {
            this.residentService.getResidentByIdFromApi(c.authorId).subscribe({
              next: (res) => {
                this.comments.update(currentComments =>
                  currentComments.map(comment =>
                    comment.id === c.id
                      ? { ...comment, author: `${res.firstName} ${res.lastName}` }
                      : comment
                  )
                );
              },
              error: () => {
                // Keep existing name or 'Résident' if fetch fails
              }
            });
          }
        });
      }
    });
  }

  postComment() {
    const text = this.newCommentText().trim();
    const incidentId = this.incident()?.id;

    if (text && incidentId) {
      this.incidentService.addComment(incidentId, {
        incidentId: incidentId,
        text: text
      }).subscribe({
        next: (newComment) => {
          this.comments.update(prev => [...prev, {
            id: newComment.id,
            incidentId: newComment.incidentId,
            author: newComment.authorName || 'You',
            text: newComment.text,
            timestamp: new Date(newComment.createdAt),
            isCurrentUser: true
          }]);
          this.newCommentText.set('');
          this.toastr.success('Comment posted');
        },
        error: () => this.toastr.error('Failed to post comment')
      });
    }
  }

  back() {
    this.router.navigate(['./dashboard/incidents']);
  }

  updateStatus(newStatus: number) {
    const currentIncident = this.incident();

    if (currentIncident && newStatus !== undefined) {
      this.incidentService.updateIncident(currentIncident.id, {
        title: currentIncident.title,
        description: currentIncident.description,
        category: currentIncident.category,
        priority: currentIncident.priority,
        location: currentIncident.location,
        status: Number(newStatus)
      }).subscribe({
        next: () => {
          this.incident.update(prev => prev ? { ...prev, status: newStatus } : undefined);
          this.toastr.success('Status updated to ' + newStatus);
        },
        error: () => this.toastr.error('Failed to update status')
      });
    }
  }
}
