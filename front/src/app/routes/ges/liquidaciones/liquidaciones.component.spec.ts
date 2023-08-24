import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidacionesComponent } from './liquidaciones.component';

describe('LiquidacionesComponent', () => {
  let component: LiquidacionesComponent;
  let fixture: ComponentFixture<LiquidacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LiquidacionesComponent]
    });
    fixture = TestBed.createComponent(LiquidacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
