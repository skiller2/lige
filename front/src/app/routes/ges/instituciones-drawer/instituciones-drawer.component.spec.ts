import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstitucionesDrawerComponent } from './instituciones-drawer.component';

describe('InstitucionesDrawerComponent', () => {
  let component: InstitucionesDrawerComponent;
  let fixture: ComponentFixture<InstitucionesDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstitucionesDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstitucionesDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 