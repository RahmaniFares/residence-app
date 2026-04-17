import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserHouseServices } from './user-house-services';
import { UserServices } from '../users/user-services';
import { HouseServices } from '../houses/house-services';
import { SettingsService } from '../settings/settings-service';
import { environment } from '../../../environments/environment';
import { UserHouse, HouseStatus } from './user-house-model';
import { UserRole } from '../users/user-model';

@Component({
  selector: 'app-user-houses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-houses.html',
})
export class UserHouses implements OnInit, OnDestroy {
  public userHouseService = inject(UserHouseServices);
  private userService = inject(UserServices);
  private houseService = inject(HouseServices);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private residenceId = environment.residenceId;

  // Signals for state
  users = toSignal(this.userService.users$, { initialValue: [] });
  houses = toSignal(this.houseService.houses$, { initialValue: [] });
  userHouses = toSignal(this.userHouseService.userHouses$, { initialValue: [] });
  pagination = toSignal(this.userHouseService.pagination$, {
    initialValue: {
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    }
  });
  loading = toSignal(this.userHouseService.loading$, { initialValue: false });
  error = toSignal(this.userHouseService.error$, { initialValue: null });

  assignmentForm: FormGroup;
  successMessage = signal<string | null>(null);

  // Selected view state
  selectedUserId = signal<string>('');
  selectedHouseId = signal<string>('');

  constructor() {
    this.assignmentForm = this.fb.group({
      userId: ['', Validators.required],
      houseId: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const user = this.settingsService.getSettings()().user;
    const role = user.role;
    const isResident = Number(role) === UserRole.Resident;

    if (isResident) {
      this.router.navigate(['/dashboard/home']);
      return;
    }

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Load users and houses to populate dropdowns
    this.userService.loadUsers(1, 100).pipe(takeUntil(this.destroy$)).subscribe();
    this.houseService.loadHouses(1, 100).pipe(takeUntil(this.destroy$)).subscribe();
  }

  onUserChange(userId: string): void {
    this.selectedUserId.set(userId);
    if (userId) {
      this.userHouseService.getUserHouses(this.residenceId, userId).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  onHouseChange(houseId: string): void {
    this.selectedHouseId.set(houseId);
    if (houseId) {
      this.userHouseService.getHouseUsers(this.residenceId, houseId).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  assignUser(): void {
    if (this.assignmentForm.invalid) return;

    const request = this.assignmentForm.value;
    this.userHouseService.assignUserToHouse(this.residenceId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (assignment) => {
          this.successMessage.set(`Utilisateur ${assignment.getUserFullName()} assigné à ${assignment.getHouseDisplayName()}`);
          this.assignmentForm.reset();
          
          // Refresh lists
          if (this.selectedUserId() === request.userId) {
            this.userHouseService.getUserHouses(this.residenceId, request.userId).pipe(takeUntil(this.destroy$)).subscribe();
          }
          if (this.selectedHouseId() === request.houseId) {
            this.userHouseService.getHouseUsers(this.residenceId, request.houseId).pipe(takeUntil(this.destroy$)).subscribe();
          }

          setTimeout(() => this.successMessage.set(null), 5000);
        }
      });
  }

  removeAssignment(userId: string, houseId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cette assignation ?')) {
      this.userHouseService.removeUserFromHouse(this.residenceId, userId, houseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.successMessage.set('Assignation supprimée avec succès');
          setTimeout(() => this.successMessage.set(null), 3000);
        });
    }
  }

  getHouseStatusColor(status: HouseStatus): string {
    return status === HouseStatus.Occupied 
      ? 'bg-blue-100 text-blue-700' 
      : 'bg-green-100 text-green-700';
  }
}
