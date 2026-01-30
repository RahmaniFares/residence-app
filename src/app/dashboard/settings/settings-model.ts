export interface UserProfile {
    username: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

export interface ResidenceSettings {
    initialBudget: number;
    residenceName: string;
    residencePlace: string;
}

export interface SettingsModel {
    user: UserProfile;
    residence: ResidenceSettings;
}
