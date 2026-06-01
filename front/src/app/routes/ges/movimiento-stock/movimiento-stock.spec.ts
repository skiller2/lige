import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientoStockComponent } from './movimiento-stock';

describe('MovimientoStockComponent', () => {
  let component: MovimientoStockComponent;
  let fixture: ComponentFixture<MovimientoStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovimientoStockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MovimientoStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
