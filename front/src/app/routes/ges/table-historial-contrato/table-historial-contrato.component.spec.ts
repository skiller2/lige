import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHistorialContratoComponent } from './table-historial-contrato.component';

describe('TableHistorialContratoComponent', () => {
  let component: TableHistorialContratoComponent;
  let fixture: ComponentFixture<TableHistorialContratoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHistorialContratoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableHistorialContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
