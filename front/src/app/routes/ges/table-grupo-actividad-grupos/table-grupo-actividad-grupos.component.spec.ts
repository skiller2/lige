import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGrupoActividadGruposComponent } from './table-grupo-actividad-grupos.component';

describe('TableGrupoActividadGruposComponent', () => {
  let component: TableGrupoActividadGruposComponent;
  let fixture: ComponentFixture<TableGrupoActividadGruposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableGrupoActividadGruposComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableGrupoActividadGruposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
