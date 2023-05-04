import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodoSelectComponent } from './periodo-select.component';

describe('PeriodoSelectComponent', () => {
  let component: PeriodoSelectComponent;
  let fixture: ComponentFixture<PeriodoSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeriodoSelectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodoSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
