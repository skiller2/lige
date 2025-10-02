import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosCargaManualComponent } from './descuentos-carga-manual';

describe('DescuentosCargaManualComponent', () => {
  let component: DescuentosCargaManualComponent;
  let fixture: ComponentFixture<DescuentosCargaManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosCargaManualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosCargaManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
