import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCondicionVentaComponent } from './table-condicion-venta.component';

describe('TableCondicionVentaComponent', () => {
  let component: TableCondicionVentaComponent;
  let fixture: ComponentFixture<TableCondicionVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCondicionVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCondicionVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
