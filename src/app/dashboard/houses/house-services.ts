import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HouseModel, HouseStatus } from './house-model';
import { environment } from '../../../environments/environment';

// --- DTOs matching backend API naming conventions ---

export interface HouseDto {
    id: string;
    block: string;
    unit: string;
    floor: string;
    status: HouseStatus;
    residentId?: string;
    residenceId: string;
    currentResident?: {
        firstName: string;
        lastName: string;
    };
}

export interface HouseDetailsDto {
    id: string;
    block: string;
    unit: string;
    floor: string;
    status: HouseStatus;
    currentResidentId?: string;
    currentResident?: any;
    totalResidents: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHouseDto {
    block: string;
    unit: string;
    floor: string;
    status: HouseStatus;
    residentId?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class HouseServices {
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    private housesSubject = new BehaviorSubject<HouseModel[]>([]);
    houses$ = this.housesSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Load all houses/units for the current residence from the backend.
     * Updates the internal BehaviorSubject for backward-compatible signals.
     */
    loadHouses(pageNumber: number = 1, pageSize: number = 50): Observable<PaginatedResult<HouseDto>> {
        const params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        return this.http.get<PaginatedResult<HouseDto>>(
            `${this.apiUrl}/${this.residenceId}/houses`,
            { params }
        ).pipe(
            tap(result => {
                const mapped: HouseModel[] = result.items.map(h => this.mapDtoToModel(h));
                this.housesSubject.next(mapped);
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
     * Add a new house via backend API.
     */
    addHouse(house: Omit<HouseModel, 'id'>): Observable<HouseDto> {
        const createDto: CreateHouseDto = {
            block: house.block,
            unit: house.unit,
            floor: house.floor,
            status: house.status,
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
        return this.http.put<HouseDto>(
            `${this.apiUrl}/${this.residenceId}/houses/${id}`,
            house
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
    private mapDtoToModel(dto: HouseDto): HouseModel {
        return {
            id: dto.id,
            block: dto.block,
            unit: dto.unit,
            floor: dto.floor,
            status: dto.status,
            residentId: dto.residentId,
            residentName: dto.currentResident ? `${dto.currentResident.firstName} ${dto.currentResident.lastName}` : undefined
        };
    }
}
