export interface CreateDonationDto {
    houseId?: string;
    donorId?: string;
    amount: number;
    donationDate?: string;
    description?: string;
}

export interface UpdateDonationDto {
    houseId?: string;
    donorId?: string;
    amount?: number;
    donationDate?: string;
    description?: string;
}

export interface DonationDto {
    id: string;
    houseId?: string;
    donorId?: string;
    amount: number;
    donationDate: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface DonationDetailDto extends DonationDto {
    house?: any;
    donor?: any;
}

export interface DonationSummary {
    totalDonations: number;
    averageDonation: number;
    largestDonation: number;
    smallestDonation: number;
}

export interface DonationByHouseSummary {
    houseId: string;
    houseName?: string;
    totalAmount: number;
    donationCount: number;
    averageAmount: number;
}
