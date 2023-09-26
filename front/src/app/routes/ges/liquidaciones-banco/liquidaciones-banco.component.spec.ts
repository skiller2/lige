import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidacionesBancoComponent } from './liquidaciones-banco.component';

describe('LiquidacionesComponent', () => {
  let component: LiquidacionesBancoComponent;
  let fixture: ComponentFixture<LiquidacionesBancoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LiquidacionesBancoComponent]
    });
    fixture = TestBed.createComponent(LiquidacionesBancoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
