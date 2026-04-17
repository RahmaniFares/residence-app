import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../settings/settings-service';
import { UserRole } from '../users/user-model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  settings = this.settingsService.getSettings();

  user = computed(() => this.settings().user);
  residence = computed(() => this.settings().residence);

  userRole = computed(() => {
    return Number(this.settings().user.role);
  });

  ngOnInit() {
    this.settingsService.refreshFromUser();
  }

  UserRole = UserRole;

  logout() {
    // Destroy settings service
    this.settingsService.destroy();
    // Clear all localStorage data
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
