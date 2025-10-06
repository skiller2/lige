import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosCargaManualTableObjetivoComponent } from './descuentos-carga-manual-table-objetivo';

describe('DescuentosCargaManualTableObjetivoComponent', () => {
  let component: DescuentosCargaManualTableObjetivoComponent;
  let fixture: ComponentFixture<DescuentosCargaManualTableObjetivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosCargaManualTableObjetivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosCargaManualTableObjetivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
