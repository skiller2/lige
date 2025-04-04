import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenciaHistorialDrawerComponent } from './licencia-historial-drawer.component';

describe('LicenciaHistorialDrawerComponent', () => {
  let component: LicenciaHistorialDrawerComponent;
  let fixture: ComponentFixture<LicenciaHistorialDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicenciaHistorialDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LicenciaHistorialDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
