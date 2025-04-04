import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGrupoActividadPersonalComponent } from './table-grupo-actividad-personal.component'

describe('TableGrupoActividadPersonalComponent', () => {
  let component: TableGrupoActividadPersonalComponent;
  let fixture: ComponentFixture<TableGrupoActividadPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableGrupoActividadPersonalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableGrupoActividadPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
