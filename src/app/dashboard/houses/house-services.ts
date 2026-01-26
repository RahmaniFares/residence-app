import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HouseModel } from './house-model';

@Injectable({
    providedIn: 'root',
})
export class HouseServices {
    private housesSubject = new BehaviorSubject<HouseModel[]>([
        {
            id: '1',
            block: 'Block A',
            unit: '101',
            floor: '1',
            status: 'Occupied',
            residentId: 'RES-1001'
        },
        {
            id: '2',
            block: 'Block A',
            unit: '102',
            floor: '1',
            status: 'Occupied',
            residentId: 'RES-1003'
        },
        {
            id: '3',
            block: 'Block A',
            unit: '103',
            floor: '1',
            status: 'Vacant'
        },
        {
            id: '4',
            block: 'Block B',
            unit: '201',
            floor: '2',
            status: 'Occupied',
            residentId: 'RES-1002'
        },
        {
            id: '5',
            block: 'Block B',
            unit: '202',
            floor: '2',
            status: 'Vacant'
        },
        {
            id: '6',
            block: 'Block C',
            unit: '301',
            floor: '3',
            status: 'Occupied',
            residentId: 'RES-1005'
        },
        {
            id: '7',
            block: 'Block C',
            unit: '302',
            floor: '3',
            status: 'Vacant'
        },
        {
            id: '8',
            block: 'Block C',
            unit: '305',
            floor: '3',
            status: 'Vacant'
        },
        {
            id: '9',
            block: 'Block D',
            unit: '401',
            floor: '4',
            status: 'Occupied',
            residentId: 'RES-1006'
        },
        {
            id: '10',
            block: 'Block D',
            unit: '402',
            floor: '4',
            status: 'Vacant'
        },
        {
            id: '11',
            block: 'Block D',
            unit: '403',
            floor: '4',
            status: 'Vacant'
        },
        {
            id: '12',
            block: 'Block D',
            unit: '405',
            floor: '4',
            status: 'Vacant'
        },
    ]);

    houses$ = this.housesSubject.asObservable();

    getHouseById(id: string): HouseModel | undefined {
        return this.housesSubject.value.find(h => h.id === id);
    }
}
