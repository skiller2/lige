import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHorasLicenciaComponent } from './table-horas-licencia.component';

describe('TableAbmLicenciaComponent', () => {
  let component: TableHorasLicenciaComponent;
  let fixture: ComponentFixture<TableHorasLicenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHorasLicenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableHorasLicenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
