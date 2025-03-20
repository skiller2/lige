import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CursoHistorialDrawerComponent } from './curso-historial-drawer.component';

describe('CursoHistorialDrawerComponent', () => {
  let component: CursoHistorialDrawerComponent;
  let fixture: ComponentFixture<CursoHistorialDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CursoHistorialDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CursoHistorialDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
