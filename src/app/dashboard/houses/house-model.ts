export enum HouseStatus {
    Occupied = 0,
    Vacant = 1
}

export interface HouseModel {
    id: string;
    block: string;
    unit: string;
    floor: string;
    status: HouseStatus;
    residentId?: string; // Optional, links to a resident
    residentName?: string;
}
