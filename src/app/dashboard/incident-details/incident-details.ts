import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { CommonModule } from '@angular/common';
import { IncidentServices } from '../incidents/incident-services';
import { IncidentModel } from '../incidents/incident-model';
import { FormsModule } from '@angular/forms';

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

  incident = signal<IncidentModel | undefined>(undefined);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const found = this.incidentService.getIncidentById(id);
        this.incident.set(found);
        this.loadComments(id);
      }
    });
  }

  // Comments logic
  comments = signal<import('../incidents/incident-model').CommentModel[]>([]);
  newCommentText = signal('');

  loadComments(incidentId: string) {
    if (!incidentId) return;
    // We subscribe to the comments stream to get real-time updates
    this.incidentService.comments$.subscribe(() => {
      const incidentComments = this.incidentService.getCommentsByIncidentId(incidentId);
      this.comments.set(incidentComments);
    });
  }

  postComment() {
    const text = this.newCommentText().trim();
    const incidentId = this.incident()?.id;

    if (text && incidentId) {
      this.incidentService.addComment({
        incidentId: incidentId,
        author: 'Admin', // Hardcoded for now as per context (Admin replying)
        text: text
      });
      this.newCommentText.set(''); // Clear input
    }
  }

  back() {
    this.router.navigate(['./dashboard/incidents']);
  }

  updateStatus(event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    const currentIncident = this.incident();

    if (currentIncident && (newStatus === 'Open' || newStatus === 'In Progress' || newStatus === 'Resolved')) {
      const updated = { ...currentIncident, status: newStatus as 'Open' | 'In Progress' | 'Resolved' };
      this.incidentService.updateIncident(updated);
      this.incident.set(updated);
    }
  }
}
