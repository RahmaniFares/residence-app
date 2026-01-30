import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../settings/settings-service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  settings = this.settingsService.getSettings();

  user = computed(() => this.settings().user);
  residence = computed(() => this.settings().residence);

  logout() {
    // In a real app, clear tokens here
    this.router.navigate(['/']);
  }
}
