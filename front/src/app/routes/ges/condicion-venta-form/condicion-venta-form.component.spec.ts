import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondicionVentaFormComponent } from './condicion-venta-form.component';

describe('CondicionVentaFormComponent', () => {
  let component: CondicionVentaFormComponent;
  let fixture: ComponentFixture<CondicionVentaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CondicionVentaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CondicionVentaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
