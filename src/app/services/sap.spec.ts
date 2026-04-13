import { TestBed } from '@angular/core/testing';

import { Sap } from './sap';

describe('Sap', () => {
  let service: Sap;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sap);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
