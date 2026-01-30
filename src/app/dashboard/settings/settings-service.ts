import { Injectable, signal } from '@angular/core';
import { SettingsModel } from './settings-model';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    // Mock initial data
    private mockData: SettingsModel = {
        user: {
            username: 'alex_admin',
            firstName: 'Alex',
            lastName: 'Morgan',
            phone: '+1 (555) 123-4567',
            email: 'alex.morgan@residence.com'
        },
        residence: {
            initialBudget: 50000,
            residenceName: 'Sunshine Heights',
            residencePlace: '123 Sunny Blvd, California'
        }
    };

    private settingsSignal = signal<SettingsModel>(this.mockData);

    constructor() { }

    getSettings() {
        return this.settingsSignal.asReadonly();
    }

    updateSettings(newSettings: SettingsModel) {
        this.mockData = newSettings;
        this.settingsSignal.set(newSettings);
        // In a real app, this would make an HTTP request
        console.log('Settings updated:', newSettings);
    }
}
