import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DepenseModel, CreateDepenseRequest, DepenseType } from './depense-model';

@Injectable({
    providedIn: 'root',
})
export class DepenseServices {

    private depensesSubject = new BehaviorSubject<DepenseModel[]>([
        {
            id: 'DEP-1001',
            titre: 'Réparation ascenseur bloc A',
            type: 'Réparations',
            montant: 2500.00,
            date: '2024-01-15',
            description: 'Remplacement du système de câbles et maintenance générale de l\'ascenseur du bloc A.',
            images: ['https://images.unsplash.com/photo-1567789884554-0b844b597180?w=400&auto=format&fit=crop&q=60'],
            createdBy: 'Admin User',
            createdAt: new Date(Date.now() - 86400000 * 15)
        },
        {
            id: 'DEP-1002',
            titre: 'Facture électricité Janvier',
            type: 'Électricité',
            montant: 1850.50,
            date: '2024-01-20',
            description: 'Facture d\'électricité pour les parties communes - mois de janvier 2024.',
            images: [],
            createdBy: 'Admin User',
            createdAt: new Date(Date.now() - 86400000 * 10)
        },
        {
            id: 'DEP-1003',
            titre: 'Service nettoyage mensuel',
            type: 'Nettoyage',
            montant: 800.00,
            date: '2024-01-22',
            description: 'Nettoyage complet des parties communes, escaliers, couloirs et halls d\'entrée.',
            images: [
                'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=60',
                'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&auto=format&fit=crop&q=60'
            ],
            createdBy: 'Admin User',
            createdAt: new Date(Date.now() - 86400000 * 8)
        },
        {
            id: 'DEP-1004',
            titre: 'Entretien jardin et espaces verts',
            type: 'Jardinage',
            montant: 450.00,
            date: '2024-01-25',
            description: 'Taille des haies, tonte du gazon et entretien des parterres de fleurs.',
            images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&auto=format&fit=crop&q=60'],
            createdBy: 'Admin User',
            createdAt: new Date(Date.now() - 86400000 * 5)
        },
        {
            id: 'DEP-1005',
            titre: 'Consommation eau T4 2023',
            type: 'Eau',
            montant: 1200.00,
            date: '2024-01-28',
            description: 'Facture d\'eau pour le quatrième trimestre 2023 - parties communes.',
            images: [],
            createdBy: 'Admin User',
            createdAt: new Date(Date.now() - 86400000 * 2)
        },
        {
            id: 'DEP-1006',
            titre: 'Contrat sécurité annuel',
            type: 'Sécurité',
            montant: 3600.00,
            date: '2024-01-30',
            description: 'Renouvellement du contrat de surveillance et maintenance des caméras de sécurité.',
            images: [],
            createdBy: 'Admin User',
            createdAt: new Date(Date.now() - 86400000)
        },
        {
            id: 'DEP-1007',
            titre: 'Achat nouvel équipement gym',
            type: 'Équipements',
            montant: 1500.00,
            date: '2024-01-31',
            description: 'Achat de nouveaux tapis de course pour la salle de sport de la résidence.',
            images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=60'],
            createdBy: 'Admin User',
            createdAt: new Date()
        }
    ]);

    depenses$ = this.depensesSubject.asObservable();

    private getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : { firstName: 'Admin', lastName: 'User' };
    }

    addDepense(request: CreateDepenseRequest): void {
        const currentDepenses = this.depensesSubject.value;
        const lastId = currentDepenses.length > 0
            ? parseInt(currentDepenses[0].id.split('-')[1])
            : 1000;

        const user = this.getCurrentUser();
        const newDepense: DepenseModel = {
            id: `DEP-${lastId + 1}`,
            titre: request.titre,
            type: request.type,
            montant: request.montant,
            date: request.date,
            description: request.description,
            images: request.images,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdAt: new Date()
        };

        this.depensesSubject.next([newDepense, ...currentDepenses]);
    }

    updateDepense(id: string, request: CreateDepenseRequest): boolean {
        const currentDepenses = this.depensesSubject.value;
        const index = currentDepenses.findIndex(d => d.id === id);

        if (index === -1) return false;

        currentDepenses[index] = {
            ...currentDepenses[index],
            ...request,
            updatedAt: new Date()
        };

        this.depensesSubject.next([...currentDepenses]);
        return true;
    }

    deleteDepense(id: string): boolean {
        const currentDepenses = this.depensesSubject.value;
        const index = currentDepenses.findIndex(d => d.id === id);

        if (index === -1) return false;

        this.depensesSubject.next(currentDepenses.filter(d => d.id !== id));
        return true;
    }

    getDepenseById(id: string): DepenseModel | undefined {
        return this.depensesSubject.value.find(d => d.id === id);
    }

    getTotalByType(type: DepenseType): number {
        return this.depensesSubject.value
            .filter(d => d.type === type)
            .reduce((sum, d) => sum + d.montant, 0);
    }

    getTotalDepenses(): number {
        return this.depensesSubject.value.reduce((sum, d) => sum + d.montant, 0);
    }

    getDepensesThisMonth(): number {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.depensesSubject.value
            .filter(d => {
                const depenseDate = new Date(d.date);
                return depenseDate.getMonth() === currentMonth && depenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, d) => sum + d.montant, 0);
    }
}
