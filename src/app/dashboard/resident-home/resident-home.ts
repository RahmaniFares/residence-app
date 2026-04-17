import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserHouseServices } from '../user-houses/user-house-services';
import { SettingsService } from '../settings/settings-service';
import { environment } from '../../../environments/environment';
import { UserHouse, HouseStatus } from '../user-houses/user-house-model';

@Component({
  selector: 'app-resident-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resident-home.html',
  styleUrl: './resident-home.css'
})
export class ResidentHome implements OnInit {
  private userHouseService = inject(UserHouseServices);
  private settingsService = inject(SettingsService);

  user = computed(() => this.settingsService.getSettings()().user);
  residence = computed(() => this.settingsService.getSettings()().residence);

  userHouses = toSignal(this.userHouseService.userHouses$, { initialValue: [] });
  loading = toSignal(this.userHouseService.loading$, { initialValue: false });

  ngOnInit() {
    const userId = this.user().id;
    if (userId) {
      this.userHouseService.getUserHouses(environment.residenceId, userId).subscribe();
    }
  }

  getHouseStatusColor(status: HouseStatus | string | number): string {
    const statusStr = typeof status === 'string' ? status.toLowerCase() : status.toString();
    
    if (status === HouseStatus.Occupied || statusStr === 'occupied' || statusStr === '0') {
      return 'bg-blue-100 text-blue-700';
    }
    if (status === HouseStatus.Vacant || statusStr === 'vacant' || statusStr === '1') {
      return 'bg-green-100 text-green-700';
    }
    return 'bg-gray-100 text-gray-700';
  }

  getHouseStatusDisplay(assignment: any): string {
    if (assignment.house?.status === HouseStatus.Occupied) return 'Occupé';
    if (assignment.house?.status === HouseStatus.Vacant) return 'Vacant';
    return 'Inconnu';
  }
}
