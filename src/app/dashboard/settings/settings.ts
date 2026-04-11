import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SettingsService } from './settings-service';
import { ResidentProfile, ResidenceSettings } from './settings-model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private settingsService = inject(SettingsService);
  private toastr = inject(ToastrService);

  // Read-only settings signal from service
  settings = this.settingsService.getSettings();

  // Loading / saving states
  isLoading = signal(false);
  isSavingResident = signal(false);
  isSavingResidence = signal(false);

  // Section-level edit modes
  isEditingResident = signal(false);
  isEditingResidence = signal(false);

  // Editable local copies (plain objects for ngModel two-way binding)
  editableUser = { ...this.settings().user };
  editableResident = { ...this.settings().resident };
  editableResidence = { ...this.settings().residence };

  constructor() {
    // Sync editable copies when source data arrives (e.g. after API load)
    effect(() => {
      const s = this.settings();
      if (!this.isEditingResident()) {
        this.editableResident = { ...s.resident };
      }
      if (!this.isEditingResidence()) {
        this.editableResidence = { ...s.residence };
      }
      this.editableUser = { ...s.user };
    });
  }

  ngOnInit() {
    // Load fresh residence data from API
    this.isLoading.set(true);
    this.settingsService.loadResidence().subscribe({
      next: () => this.isLoading.set(false),
      error: () => {
        this.isLoading.set(false);
        // Non-fatal: residence info may not be available
      }
    });
  }

  // ---- Resident section ----

  toggleEditResident() {
    if (this.isEditingResident()) {
      // Cancel: reset to current service state
      this.editableResident = { ...this.settings().resident };
    }
    this.isEditingResident.update(v => !v);
  }

  saveResident() {
    const residentId = this.settings().user.id;
    if (!residentId) {
      this.toastr.warning('Aucun résident associé à ce compte');
      return;
    }

    const r = this.editableResident;
    this.isSavingResident.set(true);

    this.settingsService.updateUserInfo(residentId, {
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phoneNumber: r.phone,
    }).subscribe({
      next: () => {
        this.toastr.success('Informations du résident mises à jour');
        this.isEditingResident.set(false);
        this.isSavingResident.set(false);
      },
      error: (err) => {
        this.toastr.error('Erreur lors de la mise à jour du résident');
        this.isSavingResident.set(false);
        console.error(err);
      }
    });
  }

  // ---- Residence section ----

  toggleEditResidence() {
    if (this.isEditingResidence()) {
      this.editableResidence = { ...this.settings().residence };
    }
    this.isEditingResidence.update(v => !v);
  }

  saveResidence() {
    const r = this.editableResidence;
    this.isSavingResidence.set(true);

    this.settingsService.updateResidence({
      name: r.residenceName,
      address: r.address,
      city: r.city,
      state: r.state,
      zipCode: r.zipCode,
      description: r.description
    }).subscribe({
      next: () => {
        this.toastr.success('Informations de la résidence mises à jour');
        this.isEditingResidence.set(false);
        this.isSavingResidence.set(false);
      },
      error: (err) => {
        this.toastr.error('Erreur lors de la mise à jour de la résidence');
        this.isSavingResidence.set(false);
        console.error(err);
      }
    });
  }
}
