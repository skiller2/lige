import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableOrdenesDeVentaComponent } from './table-ordenes-de-venta';

describe('TableOrdenesDeVentaComponent', () => {
  let component: TableOrdenesDeVentaComponent;
  let fixture: ComponentFixture<TableOrdenesDeVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableOrdenesDeVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableOrdenesDeVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
