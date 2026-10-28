import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeePaymentComponent } from './fee-payment.component';

describe('FeePaymentComponent', () => {
  let component: FeePaymentComponent;
  let fixture: ComponentFixture<FeePaymentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeePaymentComponent]
    });
    fixture = TestBed.createComponent(FeePaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
