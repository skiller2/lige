import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaAsistenciaComponent } from './carga-asistencia.componet';

describe('CargaAsistenciaComponent', () => {
  let component: CargaAsistenciaComponent;
  let fixture: ComponentFixture<CargaAsistenciaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CargaAsistenciaComponent]
    });
    fixture = TestBed.createComponent(CargaAsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});