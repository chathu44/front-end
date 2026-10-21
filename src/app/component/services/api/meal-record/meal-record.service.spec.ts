import { TestBed } from '@angular/core/testing';

import { MealRecordService } from './meal-record.service';

describe('MealRecordService', () => {
  let service: MealRecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealRecordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
