import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosCargaMasivaComponent } from './descuentos-carga-masiva.component';

describe('DescuentosCargaMasivaComponent', () => {
  let component: DescuentosCargaMasivaComponent;
  let fixture: ComponentFixture<DescuentosCargaMasivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosCargaMasivaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosCargaMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});