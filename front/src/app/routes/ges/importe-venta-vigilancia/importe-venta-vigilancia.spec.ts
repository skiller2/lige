import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImporteVentaVigilanciaComponent } from './importe-venta-vigilancia';

describe('ImporteVentaVigilanciaComponent', () => {
  let component: ImporteVentaVigilanciaComponent;
  let fixture: ComponentFixture<ImporteVentaVigilanciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImporteVentaVigilanciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImporteVentaVigilanciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
