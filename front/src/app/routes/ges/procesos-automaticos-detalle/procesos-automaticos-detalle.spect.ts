import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesosAutomaticosDetalleComponent } from './procesos-automaticos-detalle';

describe('ProcesosAutomaticosDetalleComponent', () => {
  let component: ProcesosAutomaticosDetalleComponent;
  let fixture: ComponentFixture<ProcesosAutomaticosDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesosAutomaticosDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcesosAutomaticosDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});