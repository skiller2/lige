import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametroVentaComponent } from './parametro-venta.component';

describe('ParametroVentaComponent', () => {
  let component: ParametroVentaComponent;
  let fixture: ComponentFixture<ParametroVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametroVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParametroVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
