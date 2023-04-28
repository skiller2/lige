import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodoAnioComponent } from './periodo-anio.component';

describe('PeriodoAnioComponent', () => {
  let component: PeriodoAnioComponent;
  let fixture: ComponentFixture<PeriodoAnioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeriodoAnioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodoAnioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
