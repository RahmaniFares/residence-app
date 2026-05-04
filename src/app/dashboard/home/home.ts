import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
import { ExpenseType, EXPENSE_TYPE_LABELS } from '../depenses/depense-model';
import { environment } from '../../../environments/environment';
import { UserRole } from '../users/user-model';
import { ResidentHome } from '../resident-home/resident-home';
import { map } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ResidentHome],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
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
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
  });

  // Mock Stats for the dashboard
  stats = computed(() => {
    const occupancy = this.occupancyRate();
    const collections = this.monthlyCollections();
    const outstanding = this.outstandingPayments();
    const expenses = this.monthlyExpenses();
    const residents = this.residentCount();

    return {
      today: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      cards: [
        {
          label: 'Taux d\'occupancy',
          value: `${occupancy}%`,
          icon: 'home',
          color: 'bg-blue-50 text-blue-600',
          trend: '+2.5%',
          trendUp: true
        },
        {
          label: 'Collections (Mois)',
          value: `${collections.toFixed(0)} TND`,
          icon: 'payments',
          color: 'bg-green-50 text-green-600',
          trend: '+12%',
          trendUp: true
        },
        {
          label: 'Paiements En Attente',
          value: `${outstanding.toFixed(0)} TND`,
          icon: 'pending_actions',
          color: 'bg-orange-50 text-orange-600',
          trend: 'Attention',
          trendUp: false
        },
        {
          label: 'Dépenses (Mois)',
          value: `${expenses.toFixed(0)} TND`,
          icon: 'receipt_long',
          color: 'bg-purple-50 text-purple-600',
          trend: '+5%',
          trendUp: true
        },
        {
          label: 'Résidents',
          value: `${residents}`,
          icon: 'group',
          color: 'bg-pink-50 text-pink-600',
          trend: '+1',
          trendUp: true
        }
      ]
    };
  });

  // Dynamic Chart Data from API
  chartData = signal<{ month: string, revenue: number, scaledHeight: number }[]>([]);

  // Real API KPIs
  totalKpi = signal<any>(null);
  expenseStats = signal<any>(null);

  ngOnInit() {
    this.loadKpis();
  }

  loadKpis() {
    const rId = this.settings().user?.residentId || this.residenceId;

    this.depenseService.getTotalExpenseKpi(rId).subscribe({
      next: (data) => this.totalKpi.set(data),
      error: (e) => console.error(e)
    });

    this.depenseService.getExpenseStatsByType(rId).subscribe({
      next: (data) => this.expenseStats.set(data),
      error: (e) => console.error(e)
    });

    this.depenseService.getMonthlyExpenses(rId).subscribe({
      next: (data) => {
        if (!data.data || data.data.length === 0) return;
        const maxAmount = Math.max(...data.data.map(d => d.totalAmount), 1);
        const mappedData = data.data.map(d => {
            // max height 180px
            const scaledHeight = Math.max((d.totalAmount / maxAmount) * 180, 5); // min 5px height
            return { month: d.monthName.substring(0, 3), revenue: d.totalAmount, scaledHeight };
        }).reverse(); 

        this.chartData.set(mappedData.slice(-6)); // Keep only last 6 months for chart if too many
      },
      error: (e) => console.error(e)
    });
  }

  // Mock Recent Activities
  recentActivities = signal([
    { id: 1, title: 'Paiement reçu', desc: 'Appartement B12 - 150 TND', time: 'Il y a 2h', icon: 'payments', color: 'bg-green-50 text-green-600' },
    { id: 2, title: 'Nouvel incident', desc: 'Fuite d\'eau signalée au Bloc C', time: 'Il y a 4h', icon: 'report_problem', color: 'bg-red-50 text-red-600' },
    { id: 3, title: 'Nouveau résident', desc: 'M. Ali Ben Salem - Bloc A', time: 'Hier', icon: 'person_add', color: 'bg-blue-50 text-blue-600' }
  ]);

  // Computed - Budget
  budgetTotal = computed(() => this.settings().residence.initialBudget);

  overduePaymentsCount = computed(() => {
    return this.payments().filter(p => p.status === PaymentStatus.Overdue).length;
  });

  // ---- Real Dashboard Metrics ----
  occupancyRate = computed(() => {
    const stats = this.houseStats();
    return stats.occupiedPct;
  });

  monthlyCollections = computed(() => {
    const now = new Date();
    const thisMonth = this.payments().filter(p => {
      const payDate = new Date(p.paymentDate || p.createdAt || new Date());
      return payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear()
        && p.status === PaymentStatus.Paid;
    });
    return thisMonth.reduce((sum, p) => sum + p.amount, 0);
  });

  outstandingPayments = computed(() => {
    const pending = this.payments().filter(p => p.status === PaymentStatus.Pending || p.status === PaymentStatus.Overdue);
    return pending.reduce((sum, p) => sum + p.amount, 0);
  });

  monthlyExpenses = computed(() => {
    const now = new Date();
    const thisMonth = this.expenses().filter(e => {
      const expDate = new Date(e.expenseDate || e.createdAt || new Date());
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    return thisMonth.reduce((sum, e) => sum + e.amount, 0);
  });

  residentCount = computed(() => {
    // Assuming we need to track residents - this can be fetched separately if needed
    return this.payments()
      .map(p => p.residentId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx).length;
  });

  paymentStatusBreakdown = computed(() => {
    const allPayments = this.payments();
    const paid = allPayments.filter(p => p.status === PaymentStatus.Paid).length;
    const pending = allPayments.filter(p => p.status === PaymentStatus.Pending).length;
    const overdue = allPayments.filter(p => p.status === PaymentStatus.Overdue).length;
    const total = allPayments.length;

    return {
      paid,
      pending,
      overdue,
      total,
      paidPct: total > 0 ? Math.round((paid / total) * 100) : 0,
      pendingPct: total > 0 ? Math.round((pending / total) * 100) : 0,
      overduePct: total > 0 ? Math.round((overdue / total) * 100) : 0
    };
  });

  topOutstandingResidents = computed(() => {
    const pending = this.payments().filter(p => p.status === PaymentStatus.Pending || p.status === PaymentStatus.Overdue);

    // Group by resident and sum
    const residentMap = new Map<string, { residentId: string, totalAmount: number }>();
    pending.forEach(p => {
      const existing = residentMap.get(p.residentId) || { residentId: p.residentId, totalAmount: 0 };
      existing.totalAmount += p.amount;
      residentMap.set(p.residentId, existing);
    });

    return Array.from(residentMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  });

  topExpenseCategories = computed(() => {
    const expenseMap = new Map<ExpenseType, number>();
    this.expenses().forEach(e => {
      const existing = expenseMap.get(e.type) || 0;
      expenseMap.set(e.type, existing + e.amount);
    });

    return Array.from(expenseMap.entries())
      .map(([type, amount]) => ({ type, label: EXPENSE_TYPE_LABELS[type], amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
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
  userRole = computed(() => {
    return Number(this.settings().user.role);
  });
  UserRole = UserRole;
}
