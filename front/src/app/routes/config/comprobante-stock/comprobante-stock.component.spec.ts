import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprobanteStockComponent } from './comprobante-stock.component';

describe('ComprobanteStockComponent', () => {
  let component: ComprobanteStockComponent;
  let fixture: ComponentFixture<ComprobanteStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobanteStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprobanteStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
