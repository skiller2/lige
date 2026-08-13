import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableImporteVentaVigilanciaComponent } from './table-importe-venta-vigilancia';

describe('TableImporteVentaVigilanciaComponent', () => {
  let component: TableImporteVentaVigilanciaComponent;
  let fixture: ComponentFixture<TableImporteVentaVigilanciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableImporteVentaVigilanciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableImporteVentaVigilanciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
