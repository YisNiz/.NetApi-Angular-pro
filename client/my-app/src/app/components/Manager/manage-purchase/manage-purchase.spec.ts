import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePurchase } from './manage-purchase';

describe('ManagePurchase', () => {
  let component: ManagePurchase;
  let fixture: ComponentFixture<ManagePurchase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePurchase]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagePurchase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
