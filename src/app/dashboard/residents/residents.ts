import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ResidentModel } from './resident-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-residents',
  imports: [CommonModule, FormsModule],
  templateUrl: './residents.html',
  styleUrl: './residents.css',
})
export class Residents {

  pageSizes = signal([5, 10, 25, 50]);
  page = signal(1);
  pageSize = signal(5);
  searchQuery = signal("");

  statuses = signal(['Active', 'Inactive']);
  blocks = signal(['Block A', 'Block B', 'Block C']);

  selectedStatus = signal('Active');
  selectedBlock = signal('Block A')
  onStatusChange(selectedStatus: string) {
    this.selectedStatus.set(selectedStatus);
  }
  onBlockChange(selectedBlock: string) {
    this.selectedBlock.set(selectedBlock);
  }
  constructor(private router: Router) { }

  addResident() {
    this.router.navigate(['residents/add']);
  }
  goToResidentDetails() {
    this.router.navigate(['dashboard/resident-details']);
  }
  residents: ResidentModel[] = [
    {
      id: 'RES-1001',
      firstName: 'Fares',
      lastName: 'Rahmani',
      email: 'fares.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1002',
      firstName: 'Hassan',
      lastName: 'Rahmani',
      email: 'hassan.rahmani@example.com',
      phone: '098-765-4321',
      address: '456 Elm St',
      status: 'Inactive',
      House: 'Block B, Unit 202',
      block: 'Block B',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1003',
      firstName: 'Omar',
      lastName: 'Rahmani',
      email: 'omar.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1004',
      firstName: 'Omar',
      lastName: 'Rahmani',
      email: 'omar.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1005',
      firstName: 'Ahmed',
      lastName: 'Rahmani',
      email: 'ahmed.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1006',
      firstName: 'sabeh',
      lastName: 'Rahmani',
      email: 'sabeh.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1007',
      firstName: 'sara',
      lastName: 'Rahmani',
      email: 'sara.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1008',
      firstName: 'sara',
      lastName: 'Rahmani',
      email: 'sara.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1009',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1010',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1011',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1012',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1013',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1014',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1015',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1016',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1017',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1018',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1019',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1020',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1021',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1022',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1023',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1024',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    },
    {
      id: 'RES-1025',
      firstName: 'ter',
      lastName: 'Rahmani',
      email: 'ter.rahmani@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      status: 'Active',
      House: 'Block A, Unit 101',
      block: 'Block A',
      createdAt: '2023-01-01',
    }
  ];

  paginatedResidents = computed(() => {
    let filteredResidents = this.residents;
    if (this.searchQuery()) {
      filteredResidents = this.residents.filter(resident => resident.firstName.toLowerCase().includes(this.searchQuery().toLowerCase())
        || resident.lastName.toLowerCase().includes(this.searchQuery().toLowerCase())
        || resident.House.toLowerCase().includes(this.searchQuery().toLowerCase()));
    }

    if (this.selectedStatus()) {
      filteredResidents = filteredResidents.filter(resident => resident.status === this.selectedStatus());
    }
    if (this.selectedBlock()) {
      filteredResidents = filteredResidents.filter(resident => resident.block === this.selectedBlock());
    }
    if (this.pageSize()) {
      const startIndex = (this.page() - 1) * this.pageSize();
      filteredResidents = filteredResidents.slice(startIndex, startIndex + this.pageSize());
    }
    return filteredResidents;
  });

  getAvatarColor(resident: ResidentModel): string {
    const colors = [
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
      'bg-teal-100 text-teal-700',
      'bg-indigo-100 text-indigo-700'
    ];
    // Simple hash function to get consistent index from ID
    let hash = 0;
    for (let i = 0; i < resident.id.length; i++) {
      hash = resident.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  goNextPage() {
    this.page.update(p => p + 1);
  }

  goPreviousPage() {
    this.page.update(p => p - 1);
  }

  SetPageSize(pageSize: any) {
    this.pageSize.set(Number(pageSize));
    this.page.set(1);
  }
}
