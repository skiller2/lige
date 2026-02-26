import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableParametroVentaComponent } from './table-parametro-venta.component';

describe('TableParametroVentaComponent', () => {
  let component: TableParametroVentaComponent;
  let fixture: ComponentFixture<TableParametroVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableParametroVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableParametroVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
