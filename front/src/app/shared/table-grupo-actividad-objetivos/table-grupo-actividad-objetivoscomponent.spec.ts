import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGrupoActividadObjetivosComponent } from './table-grupo-actividad-objetivos.component';

describe('TableGrupoActividadObjetivosComponent', () => {
  let component: TableGrupoActividadObjetivosComponent;
  let fixture: ComponentFixture<TableGrupoActividadObjetivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableGrupoActividadObjetivosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableGrupoActividadObjetivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
