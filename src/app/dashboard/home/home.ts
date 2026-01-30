import { Component, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IncidentServices } from '../incidents/incident-services';
import { PaymentServices } from '../payments/payment-services';
import { SettingsService } from '../settings/settings-service';
import { HouseServices } from '../houses/house-services';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private incidentService = inject(IncidentServices);
  private paymentService = inject(PaymentServices);
  private settingsService = inject(SettingsService);
  private houseService = inject(HouseServices);

  // Signals
  settings = this.settingsService.getSettings();
  incidents = toSignal(this.incidentService.incidents$, { initialValue: [] });
  payments = toSignal(this.paymentService.payments$, { initialValue: [] });
  houses = toSignal(this.houseService.houses$, { initialValue: [] });
  paymentOverview = this.paymentService.getBudgetOverview();

  // Computed - User
  userName = computed(() => {
    const user = this.settings().user;
    return `${user.firstName} ${user.lastName}`;
  });

  // Computed - Budget
  budgetTotal = computed(() => this.settings().residence.initialBudget);

  overduePaymentsCount = computed(() => {
    return this.payments().filter(p => p.status === 'Overdue').length;
  });

  // Computed - Incidents
  incidentStats = computed(() => {
    const all = this.incidents();
    const open = all.filter(i => i.status === 'Open').length;
    const inProgress = all.filter(i => i.status === 'In Progress').length;
    const resolved = all.filter(i => i.status === 'Resolved').length;
    const total = all.length;

    return { total, open, inProgress, resolved };
  });

  // Computed - Houses
  houseStats = computed(() => {
    const all = this.houses();
    const total = all.length;
    const occupied = all.filter(h => h.status === 'Occupied').length;
    const vacant = all.filter(h => h.status === 'Vacant').length;

    // Avoid division by zero
    const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const vacantPct = total > 0 ? Math.round((vacant / total) * 100) : 0;

    return { total, occupied, vacant, occupiedPct, vacantPct };
  });

  // Chart Dash Arrays (Simple calculation for the donut chart)
  incidentChartConfig = computed(() => {
    const { total, open, inProgress, resolved } = this.incidentStats();
    if (total === 0) return { open: '0 100', inProgress: '0 100', resolved: '0 100' };

    // Circumference is approx 100 for easy calc (actually 2*pi*14 ≈ 88, but let's assume the SVG coordinate space uses 100 for dasharray relative logic or adjust)
    // The current SVG uses `stroke-dasharray="60 100"`.
    // Let's stick to simple percentages for now and map to the 100ish scale if the CSS/SVG expects that.

    const openPct = (open / total) * 100;
    const inProgressPct = (inProgress / total) * 100;
    const resolvedPct = (resolved / total) * 100;

    // Accumulate offsets
    // Resolved starts at 0
    // InProgress starts after resolved
    // Open starts after resolved + inProgress

    return {
      resolved: `${resolvedPct} 100`,
      inProgress: `${inProgressPct} 100`,
      open: `${openPct} 100`,

      // Offsets
      inProgressOffset: -(resolvedPct),
      openOffset: -(resolvedPct + inProgressPct)
    };
  });
}
