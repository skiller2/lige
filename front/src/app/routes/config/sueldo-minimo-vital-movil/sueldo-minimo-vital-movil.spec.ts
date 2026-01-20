import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SueldoMinimoVitalMovil } from './sueldo-minimo-vital-movil';

describe('SueldoMinimoVitalMovilComponent', () => {
  let component: SueldoMinimoVitalMovil;
  let fixture: ComponentFixture<SueldoMinimoVitalMovil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SueldoMinimoVitalMovil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SueldoMinimoVitalMovil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
