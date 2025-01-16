import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrupoActividadComponent } from './grupo-actividad.component';

describe('GrupoActividadComponent', () => {
  let component: GrupoActividadComponent;
  let fixture: ComponentFixture<GrupoActividadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoActividadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrupoActividadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
