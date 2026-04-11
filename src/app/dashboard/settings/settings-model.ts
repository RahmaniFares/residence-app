export interface UserProfile {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role: string;
    avatarUrl: string;
    residentId: string;
}

export interface ResidentProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate?: string;
}

export interface ResidenceSettings {
    initialBudget: number;
    residenceName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    description: string;
}

export interface SettingsModel {
    user: UserProfile;
    resident: ResidentProfile;
    residence: ResidenceSettings;
}
