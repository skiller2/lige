import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHistorialProductoComponent } from './table-historial-producto.component';

describe('TableHistorialProductoComponent', () => {
  let component: TableHistorialProductoComponent;
  let fixture: ComponentFixture<TableHistorialProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHistorialProductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableHistorialProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
