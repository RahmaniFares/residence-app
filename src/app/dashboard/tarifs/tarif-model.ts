// ============================================================
// Tarif Response DTO (from backend)
// ============================================================

export interface TarifDto {
    id: string;
    residenceId: string;
    description: string;
    amount: number;
    currency: string;
    effectiveDate: Date | string;
    endDate: Date | string | null;
    isActive: boolean;
    notes?: string;
    createdAt: Date | string;
    updatedAt: Date | string | null;
}

// ============================================================
// Request DTOs (sent to backend)
// ============================================================

export interface CreateTarifDto {
    description: string;
    amount: number;
    currency: string;
    effectiveDate: Date | string;
    notes?: string;
}

export interface UpdateTarifDto {
    description?: string;
    amount?: number;
    currency?: string;
    notes?: string;
    changeReason?: string;
}

// ============================================================
// Tarif History DTO (from backend)
// ============================================================

export interface TarifHistoryDto {
    id: string;
    tarifId: string;
    residenceId: string;
    previousAmount: number;
    newAmount: number;
    previousDescription: string;
    newDescription: string;
    effectiveDate: Date | string;
    changedBy: string;
    changeReason?: string;
    changedAt: Date | string;
}

// ============================================================
// Shared utility types
// ============================================================

export interface PagedResult<T> {
    data: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface ApiError {
    message: string;
    statusCode: number;
    details?: string;
}
