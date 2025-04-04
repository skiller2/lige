import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHistorialLicenciaComponent } from './table-historial-licencia.component';

describe('TableAbmLicenciaComponent', () => {
  let component: TableHistorialLicenciaComponent;
  let fixture: ComponentFixture<TableHistorialLicenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHistorialLicenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableHistorialLicenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
