import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryConsultCustodiaDrawerComponent } from './history-consult-custodia-drawer';

describe('HistoryConsultCustodiaDrawerComponent', () => {
  let component: HistoryConsultCustodiaDrawerComponent;
  let fixture: ComponentFixture<HistoryConsultCustodiaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryConsultCustodiaDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryConsultCustodiaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
