import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGrupoActividadResponsablesComponent } from './table-grupo-actividad-responsables.component';

describe('TableGrupoActividadResponsablesComponent', () => {
  let component: TableGrupoActividadResponsablesComponent;
  let fixture: ComponentFixture<TableGrupoActividadResponsablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableGrupoActividadResponsablesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableGrupoActividadResponsablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
