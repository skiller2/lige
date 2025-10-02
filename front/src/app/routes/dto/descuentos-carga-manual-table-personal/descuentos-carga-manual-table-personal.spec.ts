import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosCargaManualTablePersonalComponent } from './descuentos-carga-manual-table-personal';

describe('DescuentosCargaManualTablePersonalComponent', () => {
  let component: DescuentosCargaManualTablePersonalComponent;
  let fixture: ComponentFixture<DescuentosCargaManualTablePersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosCargaManualTablePersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosCargaManualTablePersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
