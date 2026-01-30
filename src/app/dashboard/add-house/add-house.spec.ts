import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHouse } from './add-house';

describe('AddHouse', () => {
  let component: AddHouse;
  let fixture: ComponentFixture<AddHouse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddHouse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddHouse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
