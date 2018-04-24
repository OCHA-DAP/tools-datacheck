import { TestBed, inject } from '@angular/core/testing';

import { HxlproxyService } from './hxlproxy.service';

describe('HxlproxyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HxlproxyService]
    });
  });

  it('should be created', inject([HxlproxyService], (service: HxlproxyService) => {
    expect(service).toBeTruthy();
  }));
});
