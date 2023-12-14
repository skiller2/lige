import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrupoActividadSearchComponent } from './grupo-actividad.component';

describe('GrupoActividadSearchComponent', () => {
  let component: GrupoActividadSearchComponent;
  let fixture: ComponentFixture<GrupoActividadSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GrupoActividadSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrupoActividadSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
