import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatacheckComponent } from './datacheck.component';

describe('DatacheckComponent', () => {
  let component: DatacheckComponent;
  let fixture: ComponentFixture<DatacheckComponent>;

  beforeEach(async(() => {
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
