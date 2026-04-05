import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HouseModel, HouseStatus } from '../houses/house-model';
import { HouseServices } from '../houses/house-services';
import { ResidentServices } from '../residents/resident-services';
import { ResidentModel } from '../residents/resident-model';
import { PaymentServices } from '../payments/payment-services';
import { PaymentModel, PaymentStatus } from '../payments/payment-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-house-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './house-details.html',
  styleUrl: './house-details.css',
})
export class HouseDetails implements OnInit {

  router = inject(Router);
  route = inject(ActivatedRoute);
  houseService = inject(HouseServices);
  residentService = inject(ResidentServices);
  paymentService = inject(PaymentServices);
  toastr = inject(ToastrService);

  house = signal<HouseModel | undefined>(undefined);
  resident = signal<ResidentModel | undefined>(undefined);
  residents = signal<ResidentModel[]>([]);
  showResidentModal = signal(false);
  selectedResidentId: string | undefined = undefined;
  isUpdating = signal(false);
  payments = signal<PaymentModel[]>([]);
  showAllPayments = signal(false);

  HouseStatus = HouseStatus; // Make enum accessible in template
  PaymentStatus = PaymentStatus;

  visiblePayments = computed(() => {
    const all = this.payments();
    return this.showAllPayments() ? all : all.slice(0, 4);
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadHouseDetails(id);

        // Load payments for this specific house from the API
        this.paymentService.loadPaymentsByHouse(id, 1, 50).subscribe();

        // Subscribe to the shared payments stream
        this.paymentService.payments$.subscribe(housePayments => {
          this.payments.set(housePayments);
        });
      }
    });
  }

  private loadHouseDetails(id: string) {
    this.houseService.getHouseDetailsFromApi(id).subscribe({
      next: (dto) => {
        const mappedHouse: HouseModel = {
          id: dto.id,
          block: dto.block,
          unit: dto.unit,
          floor: dto.floor,
          status: dto.status,
          residentId: dto.currentResidentId
        };
        this.house.set(mappedHouse);

        if (dto.currentResident) {
          const mappedResident: ResidentModel = {
            id: dto.currentResident.id,
            firstName: dto.currentResident.firstName,
            lastName: dto.currentResident.lastName,
            email: dto.currentResident.email,
            phone: dto.currentResident.phoneNumber || '',
            status: 'Active',
            createdAt: dto.currentResident.createdAt?.split('T')[0] || ''
          };
          this.resident.set(mappedResident);
        } else {
          this.resident.set(undefined);
        }
      },
      error: (err) => console.error('Failed to load house details:', err)
    });
  }

  getStatusLabel(status: HouseStatus): string {
    return status === HouseStatus.Occupied ? 'Occupied' : 'Vacant';
  }

  getMonthsCount(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Rough calculation
    return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }

  back() {
    this.router.navigate(['dashboard/houses']);
  }

  showPaymentForm() {
    const h = this.house();
    if (h) {
      this.router.navigate(['dashboard/add-payment'], { queryParams: { houseId: h.id } });
    } else {
      this.router.navigate(['dashboard/add-payment']);
    }
  }

  togglePaymentHistory() {
    this.showAllPayments.update(v => !v);
  }

  openResidentModal() {
    this.selectedResidentId = this.house()?.residentId;
    this.showResidentModal.set(true);

    // Load residents list for selection
    this.residentService.loadResidents(1, 100).subscribe({
      next: (result) => {
        this.residents.set(result.items.map(r => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: r.phoneNumber || '',
          status: 'Active',
          createdAt: ''
        })));
      },
      error: (err) => {
        console.error('Failed to load residents:', err);
        this.toastr.error('Could not load residents list');
      }
    });
  }

  closeResidentModal() {
    this.showResidentModal.set(false);
  }

  saveResidentSelection() {
    const h = this.house();
    if (!h) return;

    const newResidentId = this.selectedResidentId;
    this.isUpdating.set(true);

    this.houseService.updateHouse(h.id, { ...h, residentId: newResidentId, status: HouseStatus.Occupied }).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.showResidentModal.set(false);
        this.toastr.success('Resident updated successfully');

        // Update local state
        this.loadHouseDetails(h.id);
      },
      error: (err) => {
        this.isUpdating.set(false);
        console.error('Failed to update house resident:', err);
        this.toastr.error('Failed to update resident');
      }
    });
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Paid: return 'Paid';
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Overdue: return 'Overdue';
      default: return 'Unknown';
    }
  }
}
