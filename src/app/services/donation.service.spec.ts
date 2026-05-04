import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonationService } from './donation.service';
import { DonationDto } from '../models/donation.model';

describe('DonationService', () => {
  let service: DonationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
	TestBed.configureTestingModule({
	  imports: [HttpClientTestingModule],
	  providers: [DonationService]
	});

	service = TestBed.inject(DonationService);
	httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
	httpMock.verify();
  });

  it('should fetch all donations', () => {
	const mockDonations: DonationDto[] = [
	  {
		id: '1',
		houseId: 'house-1',
		amount: 100,
		donationDate: new Date(),
		createdAt: new Date()
	  }
	];

	service.getAllDonations().subscribe(donations => {
	  expect(donations.length).toBe(1);
	  expect(donations[0].amount).toBe(100);
	});

	const req = httpMock.expectOne('/api/donations/');
	expect(req.request.method).toBe('GET');
	req.flush(mockDonations);
  });

  it('should create a donation', () => {
	const newDonation = {
	  houseId: 'house-1',
	  amount: 150
	};

	const mockResponse: DonationDto = {
	  id: '1',
	  ...newDonation,
	  donationDate: new Date(),
	  createdAt: new Date()
	};

	service.createDonation(newDonation).subscribe(result => {
	  expect(result.id).toBe('1');
	  expect(result.amount).toBe(150);
	});

	const req = httpMock.expectOne('/api/donations/');
	expect(req.request.method).toBe('POST');
	req.flush(mockResponse);
  });
});
