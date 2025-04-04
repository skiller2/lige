import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetivoHistorialDrawerComponent } from './objetivo-historial-drawer.component';

describe('ObjetivoHistorialDrawerComponent', () => {
  let component: ObjetivoHistorialDrawerComponent;
  let fixture: ComponentFixture<ObjetivoHistorialDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjetivoHistorialDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ObjetivoHistorialDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
