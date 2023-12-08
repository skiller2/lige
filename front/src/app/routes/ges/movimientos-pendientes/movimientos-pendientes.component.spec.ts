import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientosPendientes } from './movimientos-pendientes.component';

describe('FiltroBuilderComponent', () => {
  let component: MovimientosPendientes;
  let fixture: ComponentFixture<MovimientosPendientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MovimientosPendientes ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovimientosPendientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
