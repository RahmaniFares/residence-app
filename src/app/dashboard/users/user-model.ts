/**
 * UserRole enum matching .NET backend
 */
export enum UserRole {
  Admin = 1,
  Resident = 2
}

/**
 * CreateUserDto - Request body for creating a new user
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}

/**
 * UserDto - Response body containing user information
 */
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  residentId?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * UpdateUserDto - Request body for updating user profile
 */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
  avatarUrl?: string;
  residentId?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * User model class with utility methods
 */
export class UserModel {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  residentId?: string;
  createdAt: string;
  updatedAt?: string;

  constructor(data: UserResponse) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phoneNumber = data.phoneNumber;
    this.role = data.role;
    this.avatarUrl = data.avatarUrl;
    this.residentId = data.residentId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }

  isResident(): boolean {
    return this.role === UserRole.Resident;
  }

  getRoleDisplayName(): string {
    return this.role === UserRole.Admin ? 'Administrateur' : 'Résident';
  }
}
