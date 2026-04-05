import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IncidentServices } from '../incidents/incident-services';
import { IncidentCategory, IncidentPriority, CreateIncidentDto } from '../incidents/incident-model';
import { CommonModule } from '@angular/common';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-incident',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-incident.html',
  styleUrl: './add-incident.css',
})
export class AddIncident implements OnInit {
  router = inject(Router);
  incidentService = inject(IncidentServices);
  residentService = inject(ResidentServices);
  toastr = inject(ToastrService);

  // Form signals
  category = signal<IncidentCategory | ''>('');
  priority = signal<IncidentPriority>(IncidentPriority.Medium);
  title = signal('');
  description = signal('');
  location = signal('');
  selectedResidentId = signal('');

  residents = toSignal(this.residentService.residents$, { initialValue: [] });

  categories = [
    { value: IncidentCategory.Plomberie, label: 'Plomberie' },
    { value: IncidentCategory.Électricité, label: 'Électricité' },
    { value: IncidentCategory.Sécurité, label: 'Sécurité' },
    { value: IncidentCategory.ClimatisationChauffage, label: 'Climatisation / Chauffage' },
    { value: IncidentCategory.Ascenseur, label: 'Ascenseur' },
    { value: IncidentCategory.Autre, label: 'Autre' }
  ];

  priorities = [
    { value: IncidentPriority.Low, label: 'Basse' },
    { value: IncidentPriority.Medium, label: 'Moyenne' },
    { value: IncidentPriority.High, label: 'Haute' }
  ];

  ngOnInit() {
    this.residentService.loadResidents(1, 100).subscribe();
  }

  cancel() {
    this.router.navigate(['./dashboard/incidents']);
  }

  submit() {
    if (!this.title() || !this.description() || this.category() === '' || !this.selectedResidentId()) {
      this.toastr.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const dto: CreateIncidentDto = {
      title: this.title(),
      description: this.description(),
      category: Number(this.category()) as IncidentCategory,
      priority: Number(this.priority()) as IncidentPriority,
      location: this.location(),
      residentId: this.selectedResidentId()
    };

    this.incidentService.addIncident(dto).subscribe({
      next: () => {
        this.toastr.success('Incident signalé avec succès');
        this.router.navigate(['./dashboard/incidents']);
      },
      error: (err) => {
        console.error('Failed to save incident:', err);
        this.toastr.error('Échec du signalement de l\'incident');
      }
    });
  }
}
