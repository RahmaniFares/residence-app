import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HouseModel, HouseStatus } from './house-model';
import { environment } from '../../../environments/environment';

// --- DTOs matching backend API naming conventions ---

export interface CreateHouseDto {
    residentId?: string;
    block: string;
    unit: string;
    floor?: string;
}

export interface UpdateHouseDto {
    residentId?: string;
    block: string;
    unit: string;
    floor?: string;
    status: number;
}

export interface HouseDto {
    id: string;
    block: string;
    unit: string;
    floor?: string;
    status: number;
    currentResidentId?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ResidentDto {
    id: string;
    houseId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    birthDate?: string | null;
    status: number;
    moveInDate?: string | null;
    moveOutDate?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface HouseDetailsDto extends HouseDto {
    currentResident?: ResidentDto | null;
    residentsCount: number;
}

export interface HouseFinancialStatementDto {
    houseId: string;
    totalRappelPaid: number;
    totalRappelToPay: number;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount?: number;
    total?: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class HouseServices {
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    private housesSubject = new BehaviorSubject<HouseModel[]>([]);
    houses$ = this.housesSubject.asObservable();

    private loadingSubject = new BehaviorSubject<boolean>(false);
    loading$ = this.loadingSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Load all houses/units for the current residence from the backend.
     * Updates the internal BehaviorSubject for backward-compatible signals.
     */
    loadHouses(pageNumber: number = 1, pageSize: number = 50): Observable<PaginatedResult<HouseDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        this.loadingSubject.next(true);
        return this.http.get<PaginatedResult<HouseDetailsDto>>(
            `${this.apiUrl}/${this.residenceId}/houses`,
            { params }
        ).pipe(
            tap({
                next: (result) => {
                    const mapped: HouseModel[] = result.items.map(h => this.mapDtoToModel(h));
                    this.housesSubject.next(mapped);
                    this.loadingSubject.next(false);
                },
                error: () => this.loadingSubject.next(false),
                complete: () => this.loadingSubject.next(false)
            })
        );
    }

    /**
     * Get a single house by ID from the backend (async).
     */
    getHouseByIdFromApi(id: string): Observable<HouseDto> {
        return this.http.get<HouseDto>(
            `${this.apiUrl}/${this.residenceId}/houses/${id}`
        );
    }

    /**
     * Get house details including resident info from the backend (async).
     */
    getHouseDetailsFromApi(id: string): Observable<HouseDetailsDto> {
        return this.http.get<HouseDetailsDto>(
            `${this.apiUrl}/${this.residenceId}/houses/${id}/details`
        );
    }

    /**
     * Get a house by ID from local cache (synchronous).
     * Preserves backward compatibility for components needing immediate lookup.
     */
    getHouseById(id: string): HouseModel | undefined {
        return this.housesSubject.value.find(h => h.id === id);
    }

    /**
     * Get financial statement for a house from the backend (async).
     */
    getHouseFinancialStatement(id: string): Observable<HouseFinancialStatementDto> {
        return this.http.get<HouseFinancialStatementDto>(
            `${this.apiUrl}/${this.residenceId}/houses/${id}/financial-statement`
        );
    }

    /**
     * Add a new house via backend API.
     */
    addHouse(house: Omit<HouseModel, 'id'>): Observable<HouseDto> {
        const createDto: CreateHouseDto = {
            block: house.block,
            unit: house.unit,
            floor: house.floor,
            residentId: house.residentId
        };

        return this.http.post<HouseDto>(
            `${this.apiUrl}/${this.residenceId}/houses`,
            createDto
        ).pipe(
            tap(newHouse => {
                const currentHouses = this.housesSubject.value;
                this.housesSubject.next([...currentHouses, this.mapDtoToModel(newHouse)]);
            })
        );
    }

    /**
     * Update an existing house via backend API.
     */
    updateHouse(id: string, house: HouseModel): Observable<HouseDto> {
        const updateDto: UpdateHouseDto = {
            block: house.block,
            unit: house.unit,
            floor: house.floor,
            status: house.status,
            residentId: house.residentId
        };

        return this.http.put<HouseDto>(
            `${this.apiUrl}/${this.residenceId}/houses/${id}`,
            updateDto
        ).pipe(
            tap(updatedHouse => {
                const currentHouses = this.housesSubject.value;
                const index = currentHouses.findIndex(h => h.id === id);
                if (index !== -1) {
                    currentHouses[index] = this.mapDtoToModel(updatedHouse);
                    this.housesSubject.next([...currentHouses]);
                }
            })
        );
    }

    /**
     * Delete a house via backend API.
     */
    deleteHouse(id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${this.residenceId}/houses/${id}`
        ).pipe(
            tap(() => {
                const currentHouses = this.housesSubject.value;
                this.housesSubject.next(currentHouses.filter(h => h.id !== id));
            })
        );
    }

    /**
     * Helper to map backend HouseDto to the application's HouseModel.
     */
    private mapDtoToModel(dto: HouseDto | HouseDetailsDto): HouseModel {
        const details = dto as HouseDetailsDto;
        return {
            id: dto.id,
            block: dto.block,
            unit: dto.unit,
            floor: dto.floor || '1',
            status: dto.status,
            residentId: dto.currentResidentId,
            residentName: details.currentResident ? `${details.currentResident.firstName} ${details.currentResident.lastName}` : undefined
        };
    }
}
