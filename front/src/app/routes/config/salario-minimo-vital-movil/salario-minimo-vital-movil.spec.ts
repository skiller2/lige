import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalarioMinimoVitalMovil } from './salario-minimo-vital-movil';
    
describe('SalarioMinimoVitalMovilComponent', () => {
  let component: SalarioMinimoVitalMovil;
  let fixture: ComponentFixture<SalarioMinimoVitalMovil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalarioMinimoVitalMovil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalarioMinimoVitalMovil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
