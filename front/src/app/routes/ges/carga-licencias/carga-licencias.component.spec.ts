import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaLicenciasComponent } from './carga-licencias.component';

describe('CargaLicenciasComponent', () => {
  let component: CargaLicenciasComponent;
  let fixture: ComponentFixture<CargaLicenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaLicenciasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CargaLicenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
