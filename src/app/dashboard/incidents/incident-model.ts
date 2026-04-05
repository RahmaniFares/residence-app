export enum IncidentStatus {
    Open = 0,
    InProgress = 1,
    Resolved = 2,
    Closed = 3
}

export enum IncidentPriority {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

export enum IncidentCategory {
    Plomberie = 0,
    Électricité = 1,
    Sécurité = 2,
    ClimatisationChauffage = 3,
    Ascenseur = 4,
    Autre = 5
}

export interface IncidentModel {
    id: string;
    title: string;
    description: string;
    category: IncidentCategory;
    priority: IncidentPriority;
    status: IncidentStatus;
    location?: string;
    residentId?: string;
    residentName?: string; // For display convenience
    dateReported: string;  // Mapping from backend createdAt
}

export interface CommentModel {
    id: string;
    incidentId: string;
    author: string;
    text: string;
    timestamp: Date;
    isCurrentUser: boolean;
}

export interface CreateIncidentDto {
    title: string;
    description: string;
    category: IncidentCategory;
    priority?: IncidentPriority;
    location?: string;
    residentId?: string;
}

export interface UpdateIncidentDto {
    title: string;
    description: string;
    category: IncidentCategory;
    priority?: IncidentPriority;
    location?: string;
    status?: IncidentStatus;
}

export interface IncidentDto {
    id: string;
    title: string;
    description: string;
    category: IncidentCategory;
    priority: IncidentPriority;
    status: IncidentStatus;
    location?: string;
    residenceId: string;
    residentId?: string;
    reporter?: string; // This might contain the resident name or reporter name
    createdAt: string;
    updatedAt?: string;
}

export interface CreateIncidentCommentDto {
    incidentId: string;
    text: string;
}

export interface IncidentCommentDto {
    id: string;
    incidentId: string;
    text: string;
    authorId: string;
    authorName?: string;
    attachmentUrl?: string;
    createdAt: string;
    updatedAt?: string;
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
