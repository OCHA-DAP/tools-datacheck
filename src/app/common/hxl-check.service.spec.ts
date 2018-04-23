import { TestBed, inject } from '@angular/core/testing';

import { HxlCheckService } from './hxl-check.service';

describe('HxlCheckService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HxlCheckService]
    });
  });

  it('should be created', inject([HxlCheckService], (service: HxlCheckService) => {
    expect(service).toBeTruthy();
  }));
});
