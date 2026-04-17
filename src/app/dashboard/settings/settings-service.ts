import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SettingsModel } from './settings-model';
import { LoginService } from '../../login/login-service';
import { environment } from '../../../environments/environment';

export interface UpdateResidenceDto {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    description: string;
}

export interface ResidenceDto {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    description?: string;
    initialBudget?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private http = inject(HttpClient);
    private loginService = inject(LoginService);
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    // Build initial settings from localStorage (populated on login)
    private buildInitialSettings(): SettingsModel {
        const user = this.loginService.getCurrentUser();
        return {
            user: {
                id: user?.id || '',
                username: user?.email || '',
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                phone: user?.phoneNumber || '',
                email: user?.email || '',
                role: user?.role || '',
                avatarUrl: user?.avatarUrl || '',
                residentId: user?.residentId || '',
            },
            resident: {
                id: user?.residentId || '',
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                email: user?.email || '',
                phone: user?.phoneNumber || '',
                birthDate: user?.resident?.birthDate || '',
            },
            residence: {
                initialBudget: 0,
                residenceName: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                description: '',
            }
        };
    }

    private settingsSignal = signal<SettingsModel>(this.buildInitialSettings());

    getSettings() {
        return this.settingsSignal.asReadonly();
    }

    /** Refresh settings from the current localStorage user */
    refreshFromUser() {
        this.settingsSignal.set(this.buildInitialSettings());
    }

    /** Update residence info via API */
    updateResidence(dto: UpdateResidenceDto): Observable<ResidenceDto> {
        return this.http.put<ResidenceDto>(
            `${this.apiUrl}/${this.residenceId}`,
            dto
        ).pipe(
            tap(updated => {
                const current = this.settingsSignal();
                this.settingsSignal.set({
                    ...current,
                    residence: {
                        initialBudget: updated.initialBudget ?? current.residence.initialBudget,
                        residenceName: updated.name ?? current.residence.residenceName,
                        address: updated.address ?? current.residence.address,
                        city: updated.city ?? current.residence.city,
                        state: updated.state ?? current.residence.state,
                        zipCode: updated.zipCode ?? current.residence.zipCode,
                        description: updated.description ?? current.residence.description,
                    }
                });
            })
        );
    }

    /** Load residence info from API */
    loadResidence(): Observable<ResidenceDto> {
        return this.http.get<ResidenceDto>(
            `${this.apiUrl}/${this.residenceId}`
        ).pipe(
            tap(data => {
                const current = this.settingsSignal();
                this.settingsSignal.set({
                    ...current,
                    residence: {
                        initialBudget: data.initialBudget ?? 0,
                        residenceName: data.name ?? '',
                        address: data.address ?? '',
                        city: data.city ?? '',
                        state: data.state ?? '',
                        zipCode: data.zipCode ?? '',
                        description: data.description ?? '',
                    }
                });
            })
        );
    }

    /** Update resident info via API (resident linked to user) */
    updateUserInfo(userId: string, dto: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string }): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}/users/${userId}`,
            dto
        ).pipe(
            tap(updated => {
                const current = this.settingsSignal();
                // Update user localStorage cache as well
                const storedUser = this.loginService.getCurrentUser();
                if (storedUser) {
                    const newUser = {
                        ...storedUser,
                        firstName: updated.firstName ?? storedUser.firstName,
                        lastName: updated.lastName ?? storedUser.lastName,
                        email: updated.email ?? storedUser.email,
                        phoneNumber: updated.phoneNumber ?? storedUser.phoneNumber,
                        fullName: `${updated.firstName ?? storedUser.firstName} ${updated.lastName ?? storedUser.lastName}`,
                    };
                    localStorage.setItem('currentUser', JSON.stringify(newUser));
                }
                this.settingsSignal.set({
                    ...current,
                    user: {
                        ...current.user,
                        firstName: updated.firstName ?? current.user.firstName,
                        lastName: updated.lastName ?? current.user.lastName,
                        email: updated.email ?? current.user.email,
                        phone: updated.phoneNumber ?? current.user.phone,
                    },
                    resident: {
                        ...current.resident,
                        firstName: updated.firstName ?? current.resident.firstName,
                        lastName: updated.lastName ?? current.resident.lastName,
                        email: updated.email ?? current.resident.email,
                        phone: updated.phoneNumber ?? current.resident.phone,
                        birthDate: updated.birthDate ?? current.resident.birthDate,
                    }
                });
            })
        );
    }

    /** Clear all settings (called on logout) */
    clearSettings() {
        this.settingsSignal.set(this.buildInitialSettings());
    }

    /** Destroy the service (reset all state on logout) */
    destroy() {
        this.clearSettings();
        // Reset to empty/default state
        this.settingsSignal.set({
            user: {
                id: '',
                username: '',
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                role: '',
                avatarUrl: '',
                residentId: '',
            },
            resident: {
                id: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                birthDate: '',
            },
            residence: {
                initialBudget: 0,
                residenceName: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                description: '',
            }
        });
    }

    /** Legacy – kept for backward compat with sidebar/home (local only) */
    updateSettings(newSettings: SettingsModel) {
        this.settingsSignal.set(newSettings);
    }
}
