import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImporteVentaVigilanciaCarga } from './importe-venta-vigilancia-carga';

describe('ImporteVentaCargaComponent', () => {
  let component: ImporteVentaVigilanciaCarga;
  let fixture: ComponentFixture<ImporteVentaVigilanciaCarga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImporteVentaVigilanciaCarga]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImporteVentaVigilanciaCarga);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
