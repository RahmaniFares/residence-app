import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IncidentServices } from '../incidents/incident-services';
import { PaymentServices } from '../payments/payment-services';
import { SettingsService } from '../settings/settings-service';
import { HouseServices } from '../houses/house-services';
import { HouseStatus } from '../houses/house-model';
import { PaymentStatus } from '../payments/payment-model';
import { IncidentStatus } from '../incidents/incident-model';
import { DepenseServices } from '../depenses/depense-services';
import { environment } from '../../../environments/environment';
import { DepenseModel } from '../depenses/depense-model';
import { map } from 'rxjs';

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
  private depenseService = inject(DepenseServices);

  private residenceId = environment.residenceId;

  // Signals
  settings = this.settingsService.getSettings();
  payments = toSignal(this.paymentService.payments$, { initialValue: [] });
  houses = toSignal(this.houseService.houses$, { initialValue: [] });
  paymentOverview = this.paymentService.getBudgetOverview();

  // Period filter
  filterPeriod = signal<'day' | 'month' | 'year'>('day');

  // Load expenses
  private expenses$ = this.depenseService.getExpensesByResidence(this.residenceId, { pageSize: 1000 }).pipe(
    map(res => res.items)
  );
  expenses = toSignal(this.expenses$, { initialValue: [] });

  // Computed - User
  userName = computed(() => {
    const user = this.settings().user;
    return `${user.firstName} ${user.lastName}`;
  });

  // Computed - Budget
  budgetTotal = computed(() => this.settings().residence.initialBudget);

  overduePaymentsCount = computed(() => {
    return this.payments().filter(p => p.status === PaymentStatus.Overdue).length;
  });

  // Computed - Houses
  houseStats = computed(() => {
    const all = this.houses();
    const total = all.length;
    const occupied = all.filter(h => h.status === HouseStatus.Occupied).length;
    const vacant = all.filter(h => h.status === HouseStatus.Vacant).length;

    // Avoid division by zero
    const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const vacantPct = total > 0 ? Math.round((vacant / total) * 100) : 0;

    return { total, occupied, vacant, occupiedPct, vacantPct };
  });

  // ---- Budget Evolution Logic ----
  budgetHistory = computed(() => {
    const initial = this.settings().residence.initialBudget || 0;
    const payments = this.payments();
    const expenses = this.expenses();
    const period = this.filterPeriod();

    // Map events to a common structure
    const allEvents = [
      ...payments.map(p => ({
        date: new Date(p.paymentDate || p.createdAt || new Date()),
        amount: p.amount,
        type: 'income' as const
      })),
      ...expenses.map(e => ({
        date: new Date(e.expenseDate || e.createdAt || new Date()),
        amount: e.amount,
        type: 'expense' as const
      }))
    ];

    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Aggregate by period if needed
    let processedEvents = allEvents;
    if (period !== 'day') {
      const groups = new Map<string, { date: Date, amount: number }>();
      allEvents.forEach(e => {
        let key = '';
        if (period === 'month') key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
        else key = `${e.date.getFullYear()}`;

        const existing = groups.get(key) || { date: e.date, amount: 0 };
        existing.amount += (e.type === 'income' ? e.amount : -e.amount);
        groups.set(key, existing);
      });
      processedEvents = Array.from(groups.values())
        .map(g => ({ date: g.date, amount: g.amount, type: g.amount >= 0 ? 'income' as const : 'expense' as const }));
    }

    // Calculate cumulative balance
    let currentBalance = initial;
    const history: { date: string, balance: number, rawDate: Date }[] = [{ date: 'Initial', balance: initial, rawDate: new Date(0) }];

    processedEvents.forEach(e => {
      if (period === 'day') {
        currentBalance += (e.type === 'income' ? e.amount : -e.amount);
      } else {
        currentBalance += e.amount; // already signed in aggregation
      }
      
      let dateStr = '';
      if (period === 'day') dateStr = e.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      else if (period === 'month') dateStr = e.date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      else dateStr = e.date.toLocaleDateString('fr-FR', { year: 'numeric' });

      history.push({ date: dateStr, balance: currentBalance, rawDate: e.date });
    });

    return history.slice(-12); // Last 12 points
  });

  // SVG Line Chart Data
  budgetChartPoints = computed(() => {
    const history = this.budgetHistory();
    if (history.length < 2) return [];

    const balances = history.map(h => h.balance);
    const maxBalance = Math.max(...balances);
    const minBalance = Math.min(...balances);
    const range = (maxBalance - minBalance) || 1;
    
    // Add 10% padding top and bottom
    const pad = range * 0.1;
    const chartMin = minBalance - pad;
    const chartMax = maxBalance + pad;
    const chartRange = chartMax - chartMin;

    const width = 300;
    const height = 100;

    return history.map((h, i) => ({
      x: (i / (history.length - 1)) * width,
      y: height - ((h.balance - chartMin) / chartRange) * height,
      date: h.date,
      balance: h.balance
    }));
  });

  budgetChartPath = computed(() => {
    const points = this.budgetChartPoints();
    if (points.length < 2) return '';
    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  });

  budgetChartArea = computed(() => {
    const path = this.budgetChartPath();
    if (!path) return '';
    return `${path} L 300,100 L 0,100 Z`;
  });
}
