import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametroVentaFormComponent } from './parametro-venta-form.component';

describe('ParametroVentaFormComponent', () => {
  let component: ParametroVentaFormComponent;
  let fixture: ComponentFixture<ParametroVentaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametroVentaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParametroVentaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
