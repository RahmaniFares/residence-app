export interface HouseModel {
    id: string;
    block: string;
    unit: string;
    floor: string;
    status: 'Occupied' | 'Vacant';
    residentId?: string; // Optional, links to a resident
}
