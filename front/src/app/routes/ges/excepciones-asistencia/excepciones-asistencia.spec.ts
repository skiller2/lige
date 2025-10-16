import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcepcionesAsistenciaComponent } from './excepciones-asistencia';

describe('ExcepcionesAsistenciaComponent', () => {
  let component: ExcepcionesAsistenciaComponent;
  let fixture: ComponentFixture<ExcepcionesAsistenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcepcionesAsistenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcepcionesAsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});