import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageDonors } from './manage-donors';

describe('ManageDonors', () => {
  let component: ManageDonors;
  let fixture: ComponentFixture<ManageDonors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageDonors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageDonors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
