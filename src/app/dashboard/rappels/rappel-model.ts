// ============================================================
// Rappel Status Enum
// ============================================================

export enum RappelStatus {
    Unpaid = 0,
    Paid = 1
}

// ============================================================
// Rappel Response DTO (from backend)
// ============================================================

export interface RappelDto {
    id: string;
    houseId: string;
    amount: number;
    status: RappelStatus;
    notes?: string;
    paymentDate?: string;
    createdAt: string;
    updatedAt?: string;
}

// ============================================================
// Request DTOs (sent to backend)
// ============================================================

export interface CreateRappelDto {
    houseId: string;
    amount: number;
    notes?: string;
}

export interface UpdateRappelDto {
    amount?: number;
    notes?: string;
    status?: RappelStatus;
}

// ============================================================
// Pagination
// ============================================================

export interface PaginatedRappelsResponse {
    items: RappelDto[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
