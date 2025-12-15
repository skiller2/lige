import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabilitacionesDetalleComponent } from './habilitaciones-detalle';

describe('HabilitacionesDetalleComponent', () => {
  let component: HabilitacionesDetalleComponent;
  let fixture: ComponentFixture<HabilitacionesDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabilitacionesDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabilitacionesDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});