import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableAbmLicenciaComponent } from './table-abm-licencia.component';

describe('TableAbmLicenciaComponent', () => {
  let component: TableAbmLicenciaComponent;
  let fixture: ComponentFixture<TableAbmLicenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableAbmLicenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableAbmLicenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
