import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from './settings-service';
import { SettingsModel } from './settings-model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private settingsService = inject(SettingsService);

  // existing settings from service (read-only)
  settings = this.settingsService.getSettings();

  // local state for editing
  isEditing = signal(false);
  editableSettings = signal<SettingsModel>(JSON.parse(JSON.stringify(this.settings())));

  constructor() {
    // optional: update editable settings if source changes
    effect(() => {
      this.editableSettings.set(JSON.parse(JSON.stringify(this.settings())));
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      // Cancel logic: reset form
      this.editableSettings.set(JSON.parse(JSON.stringify(this.settings())));
    }
    this.isEditing.update(v => !v);
  }

  save() {
    this.settingsService.updateSettings(this.editableSettings());
    this.isEditing.set(false);
  }
}
