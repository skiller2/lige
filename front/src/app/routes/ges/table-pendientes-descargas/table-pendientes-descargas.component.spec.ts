import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePendientesDescargasComponent } from './table-pendientes-descargas.component';

describe('TablePendientesDescargasComponent', () => {
  let component: TablePendientesDescargasComponent;
  let fixture: ComponentFixture<TablePendientesDescargasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePendientesDescargasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablePendientesDescargasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});