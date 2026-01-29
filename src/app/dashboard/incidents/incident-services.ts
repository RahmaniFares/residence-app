import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IncidentModel, CommentModel } from './incident-model';

@Injectable({
    providedIn: 'root',
})
export class IncidentServices {

    private incidentsSubject = new BehaviorSubject<IncidentModel[]>([
        {
            id: 'INC-2001',
            residentId: 'RES-1001',
            residentName: 'Johnathan Doe',
            block: 'Block A',
            unit: 'Unit 102',
            dateReported: '2023-10-24',
            description: 'Water leakage in the master bathroom ceiling',
            status: 'Open',
            category: 'Plumbing'
        },
        {
            id: 'INC-2002',
            residentId: 'RES-1002',
            residentName: 'Sarah Jenkins',
            block: 'Block B',
            unit: 'Unit 405',
            dateReported: '2023-10-23',
            description: 'Kitchen sink disposal not working properly',
            status: 'In Progress',
            category: 'Plumbing'
        },
        {
            id: 'INC-2003',
            residentId: 'RES-1003',
            residentName: 'Michael Wong',
            block: 'Block C',
            unit: 'Unit 201',
            dateReported: '2023-10-20',
            description: 'Balcony light bulb replacement needed',
            status: 'Resolved',
            category: 'Electrical'
        },
        {
            id: 'INC-2004',
            residentId: 'RES-1004',
            residentName: 'Emma Davis',
            block: 'Block A',
            unit: 'Unit 305',
            dateReported: '2023-10-18',
            description: 'Lobby door lock jamming occasionally',
            status: 'Resolved',
            category: 'Security'
        },
        {
            id: 'INC-2005',
            residentId: 'RES-1005',
            residentName: 'David Miller',
            block: 'Block B',
            unit: 'Unit 110',
            dateReported: '2023-10-25',
            description: 'Noisy air conditioning unit',
            status: 'Open',
            category: 'HVAC'
        },
        {
            id: 'INC-2006',
            residentId: 'RES-1006',
            residentName: 'Lisa Anderson',
            block: 'Block C',
            unit: 'Unit 504',
            dateReported: '2023-10-22',
            description: 'Gym treadmill display malfunction',
            status: 'In Progress',
            category: 'Amenities'
        },
        {
            id: 'INC-2007',
            residentId: 'RES-1007',
            residentName: 'James Wilson',
            block: 'Block A',
            unit: 'Unit 202',
            dateReported: '2023-10-26',
            description: 'Corridor light flickering on 2nd floor',
            status: 'Open',
            category: 'Electrical'
        },
        {
            id: 'INC-2008',
            residentId: 'RES-1008',
            residentName: 'Patricia Taylor',
            block: 'Block B',
            unit: 'Unit 303',
            dateReported: '2023-10-15',
            description: 'Pest control request',
            status: 'Resolved',
            category: 'Other'
        },
        {
            id: 'INC-2009',
            residentId: 'RES-1009',
            residentName: 'Robert Martinez',
            block: 'Block C',
            unit: 'Unit 105',
            dateReported: '2023-10-27',
            description: 'Intercom system silent',
            status: 'Open',
            category: 'Security'
        },
        {
            id: 'INC-2010',
            residentId: 'RES-1010',
            residentName: 'Jennifer White',
            block: 'Block A',
            unit: 'Unit 401',
            dateReported: '2023-10-21',
            description: 'Parking spot blockage',
            status: 'Resolved',
            category: 'Other'
        },
        {
            id: 'INC-2011',
            residentId: 'RES-1011',
            residentName: 'William Brown',
            block: 'Block B',
            unit: 'Unit 205',
            dateReported: '2023-10-24',
            description: 'Elevator B button sluggish',
            status: 'In Progress',
            category: 'Elevator'
        },
        {
            id: 'INC-2012',
            residentId: 'RES-1012',
            residentName: 'Elizabeth Jones',
            block: 'Block C',
            unit: 'Unit 302',
            dateReported: '2023-10-19',
            description: 'Garden sprinkler leaking',
            status: 'Resolved',
            category: 'Plumbing'
        }
    ]);

    incidents$ = this.incidentsSubject.asObservable();

    addIncident(incident: Omit<IncidentModel, 'id' | 'dateReported' | 'status'>) {
        const currentIncidents = this.incidentsSubject.value;
        const lastId = currentIncidents.length > 0
            ? parseInt(currentIncidents[currentIncidents.length - 1].id.split('-')[1])
            : 2000;

        const newIncident: IncidentModel = {
            ...incident,
            id: `INC-${lastId + 1}`,
            status: 'Open',
            dateReported: new Date().toISOString().split('T')[0],
        };

        this.incidentsSubject.next([newIncident, ...currentIncidents]);
    }

    getIncidentById(id: string): IncidentModel | undefined {
        return this.incidentsSubject.value.find(i => i.id === id);
    }

    updateIncident(updatedIncident: IncidentModel) {
        const currentIncidents = this.incidentsSubject.value;
        const index = currentIncidents.findIndex(i => i.id === updatedIncident.id);
        if (index !== -1) {
            currentIncidents[index] = updatedIncident;
            this.incidentsSubject.next([...currentIncidents]);
        }
    }

    private commentsSubject = new BehaviorSubject<CommentModel[]>([
        {
            id: 'CMT-1',
            incidentId: 'INC-2001',
            author: 'Johnathan Doe',
            text: 'Hi, just wanted to add that the leak seems to happen mostly when we run the hot water.',
            timestamp: new Date(new Date().getTime() - 86400000), // Yesterday
            isCurrentUser: false
        },
        {
            id: 'CMT-2',
            incidentId: 'INC-2001',
            author: 'Admin',
            text: 'Thanks for the update, Johnathan. I\'ve assigned a plumber. They should contact you shortly to schedule a visit.',
            timestamp: new Date(new Date().getTime() - 84000000), // Yesterday later
            isCurrentUser: true
        },
        {
            id: 'CMT-3',
            incidentId: 'INC-2001',
            author: 'Johnathan Doe',
            text: 'Great, thank you! I\'ll be home all day tomorrow if that works for them.',
            timestamp: new Date(),
            isCurrentUser: false
        }
    ]);

    comments$ = this.commentsSubject.asObservable();


    getCommentsByIncidentId(incidentId: string): CommentModel[] {
        return this.commentsSubject.value.filter(c => c.incidentId === incidentId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    addComment(comment: Omit<CommentModel, 'id' | 'timestamp' | 'isCurrentUser'>) {
        const currentComments = this.commentsSubject.value;
        const newComment: CommentModel = {
            ...comment,
            id: `CMT-${Date.now()}`,
            timestamp: new Date(),
            isCurrentUser: true // Assuming adding via UI is always current user (Admin)
        };
        this.commentsSubject.next([...currentComments, newComment]);
    }
}
