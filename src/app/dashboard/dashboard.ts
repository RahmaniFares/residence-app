import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLinkWithHref, RouterLinkActive, CommonModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  AppName = 'Residom';
  showMobileMenu = false;

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
}
