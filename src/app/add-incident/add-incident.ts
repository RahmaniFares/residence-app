import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IncidentServices } from '../dashboard/incidents/incident-services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-incident',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-incident.html',
  styleUrl: './add-incident.css',
})
export class AddIncident {
  router = inject(Router);
  incidentService = inject(IncidentServices);

  // Form signals
  // Form signals
  type = signal('');
  title = signal('');
  description = signal('');

  categories = signal([
    'Plomberie',
    'Électricité',
    'Sécurité',
    'Climatisation / Chauffage',
    'Ascenseur',
    'Autre'
  ]);

  cancel() {
    this.router.navigate(['./dashboard/incidents']);
  }

  submit() {
    if (!this.title() || !this.description() || !this.type()) {
      alert('Please fill in all fields');
      return;
    }

    // Combine type, title, and description into the description field since model is limited
    // Update: now we have a category field so we pass type as category

    this.incidentService.addIncident({
      residentId: 'RES-1001', // Mocked user
      residentName: 'Johnathan Doe', // Mocked user
      block: 'Block A', // Mocked user
      unit: 'Unit 102', // Mocked user
      description: this.description(),
      category: this.type()
    });

    this.router.navigate(['./dashboard/incidents']);
  }
}
