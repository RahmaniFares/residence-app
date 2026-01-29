export interface IncidentModel {
    id: string;
    residentId: string;
    residentName: string; // Including for display ease as in current HTML mock
    block: string;        // Including for display ease
    unit: string;         // Including for display ease
    dateReported: string;
    description: string;
    category: string;
    status: 'Open' | 'In Progress' | 'Resolved';
}

export interface CommentModel {
    id: string;
    incidentId: string;
    author: string;
    text: string;
    timestamp: Date;
    isCurrentUser: boolean;
}
