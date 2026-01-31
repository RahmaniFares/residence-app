export interface DepenseModel {
    id: string;
    titre: string;
    type: DepenseType;
    montant: number;
    date: string;
    description: string;
    images: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}

export type DepenseType =
    | 'Maintenance'
    | 'Électricité'
    | 'Eau'
    | 'Nettoyage'
    | 'Sécurité'
    | 'Jardinage'
    | 'Réparations'
    | 'Équipements'
    | 'Assurance'
    | 'Taxes'
    | 'Autre';

export const DEPENSE_TYPES: DepenseType[] = [
    'Maintenance',
    'Électricité',
    'Eau',
    'Nettoyage',
    'Sécurité',
    'Jardinage',
    'Réparations',
    'Équipements',
    'Assurance',
    'Taxes',
    'Autre'
];

export interface CreateDepenseRequest {
    titre: string;
    type: DepenseType;
    montant: number;
    date: string;
    description: string;
    images: string[];
}
