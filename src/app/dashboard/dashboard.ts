import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { Router, RouterOutlet, RouterLinkWithHref, RouterLinkActive } from '@angular/router';
import { SettingsService } from './settings/settings-service';
import { UserRole } from './users/user-model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLinkWithHref, RouterLinkActive, CommonModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  AppName = 'Residom';
  showMobileMenu = false;

  userRole = computed(() => Number(this.settingsService.getSettings()().user.role));
  UserRole = UserRole;

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  logout() {
    this.settingsService.destroy();
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
