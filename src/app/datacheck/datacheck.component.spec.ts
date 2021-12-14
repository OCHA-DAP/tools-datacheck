import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DatacheckComponent } from './datacheck.component';

describe('DatacheckComponent', () => {
  let component: DatacheckComponent;
  let fixture: ComponentFixture<DatacheckComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DatacheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatacheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
