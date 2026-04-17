import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserServices } from './user-services';
import { UserModel, UserRole, CreateUserRequest, UpdateUserRequest } from './user-model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private userService = inject(UserServices);
  private fb = inject(FormBuilder);

  // Signals
  users = toSignal(this.userService.users$, { initialValue: [] });
  pagination = toSignal(this.userService.pagination$, { 
    initialValue: { totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false } 
  });
  loading = toSignal(this.userService.loading$, { initialValue: false });
  error = toSignal(this.userService.error$, { initialValue: null });

  // UI State
  showModal = signal(false);
  isEditing = signal(false);
  selectedUser = signal<UserModel | null>(null);
  searchQuery = signal('');
  
  // Computed
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.users().filter(u => 
      u.getFullName().toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    );
  });

  userForm: FormGroup;
  protected UserRole = UserRole;
  protected Math = Math;

  constructor() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: [''],
      role: [UserRole.Resident, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.userService.loadUsers(page, 10).subscribe();
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.selectedUser.set(null);
    this.userForm.reset({ role: UserRole.Resident });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('email')?.enable();
    this.showModal.set(true);
  }

  openEditModal(user: UserModel): void {
    this.isEditing.set(true);
    this.selectedUser.set(user);
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role
    });
    // Email and password are not editable in profile update according to backend DTOs provided
    this.userForm.get('email')?.disable();
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    if (this.isEditing()) {
      const request: UpdateUserRequest = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        phoneNumber: this.userForm.value.phoneNumber,
        role: Number(this.userForm.value.role)
      };
      this.userService.updateUser(this.selectedUser()!.id, request).subscribe({
        next: () => this.closeModal(),
        error: (err) => console.error(err)
      });
    } else {
      const formValue = this.userForm.getRawValue();
      const request: CreateUserRequest = {
        ...formValue,
        role: Number(formValue.role)
      };
      this.userService.createUser(request).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers(); // Refresh list to get new pagination state
        },
        error: (err) => console.error(err)
      });
    }
  }

  deleteUser(user: UserModel): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.getFullName()} ?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => this.loadUsers(this.pagination().pageNumber),
        error: (err) => console.error(err)
      });
    }
  }

  onPageChange(page: number): void {
    this.loadUsers(page);
  }

  getRoleColor(role: UserRole): string {
    return role === UserRole.Admin 
      ? 'bg-purple-100 text-purple-700 border-purple-200' 
      : 'bg-blue-100 text-blue-700 border-blue-200';
  }

  getAvatarColor(user: UserModel): string {
    const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    const index = (user.firstName.length + user.lastName.length) % colors.length;
    return colors[index];
  }
}
