import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcepcionAsistenciaComponent } from './asistenciaexcepcion.component';

describe('CredPersComponent', () => {
  let component: ExcepcionAsistenciaComponent;
  let fixture: ComponentFixture<ExcepcionAsistenciaComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ExcepcionAsistenciaComponent]
      }).compileComponents();
    })
  );
    
  beforeEach(() => {
    fixture = TestBed.createComponent(ExcepcionAsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
