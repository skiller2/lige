import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodoSearchComponent } from './periodo-search';

describe('FechaComponent', () => {
  let component: PeriodoSearchComponent;
  let fixture: ComponentFixture<PeriodoSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PeriodoSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});