import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratoHistorialDrawerComponent } from './contrato-historial-drawer.component';

describe('ContratoHistorialDrawerComponent', () => {
  let component: ContratoHistorialDrawerComponent;
  let fixture: ComponentFixture<ContratoHistorialDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoHistorialDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContratoHistorialDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
