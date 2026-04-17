/**
 * User-House relationship models
 * Matches: residence.application/DTOs/UserHouseDto.cs
 */

/**
 * House status enum
 */
export enum HouseStatus {
  Occupied = 0,
  Vacant = 1
}

/**
 * CreateUserHouseDto - Request to assign user to house
 */
export interface CreateUserHouseRequest {
  userId: string;
  houseId: string;
  notes?: string;
}

/**
 * UpdateUserHouseDto - Request to update user-house relationship
 */
export interface UpdateUserHouseRequest {
  notes?: string;
}

/**
 * User summary for user-house relationship
 */
export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
}

/**
 * House summary for user-house relationship
 */
export interface HouseSummary {
  id: string;
  block: string;
  floor: number;
  unit: number;
  status: HouseStatus;
}

/**
 * UserHouseDto - Response containing user-house relationship
 */
export interface UserHouseResponse {
  id: string;
  userId: string;
  houseId: string;
  assignedDate: string; // ISO string from backend
  notes?: string;
  user?: UserSummary;
  house?: HouseSummary;
}

/**
 * Paginated user-house response
 */
export interface PaginatedUserHousesResponse<T = UserHouseResponse> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * User-House details
 */
export interface UserHouseDetails extends UserHouseResponse {
  userDetails?: UserSummary;
  houseDetails?: HouseSummary;
}

/**
 * Assignment check response
 */
export interface AssignmentCheckResponse {
  isAssigned: boolean;
}

/**
 * User-House class with utility methods
 */
export class UserHouse {
  id: string;
  userId: string;
  houseId: string;
  assignedDate: Date;
  notes?: string;
  user?: UserSummary;
  house?: HouseSummary;

  constructor(data: any) {
    this.id = data.id;
    this.userId = data.userId || '';
    this.houseId = data.houseId || data.id; // Fallback if flattened
    this.assignedDate = data.assignedDate ? new Date(data.assignedDate) : new Date();
    this.notes = data.notes;
    
    // Support nested or flattened user details
    this.user = data.user;
    
    // Support nested or flattened house details
    this.house = data.house || {
      id: data.houseId || data.id,
      block: data.block,
      floor: data.floor,
      unit: data.unit,
      status: data.status
    };
  }

  /**
   * Get house display name (Block-Floor-Unit)
   */
  getHouseDisplayName(): string {
    if (this.house) {
      return `${this.house.block}-${this.house.floor}-${this.house.unit}`;
    }
    return 'N/A';
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    if (this.user) {
      return `${this.user.firstName} ${this.user.lastName}`;
    }
    return 'N/A';
  }

  /**
   * Get house status display
   */
  getHouseStatusDisplay(): string {
    if (this.house) {
      return this.house.status === HouseStatus.Occupied ? 'Occupied' : 'Vacant';
    }
    return 'N/A';
  }
}
