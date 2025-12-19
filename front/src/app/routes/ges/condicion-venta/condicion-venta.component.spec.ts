import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondicionVentaComponent } from './condicion-venta.component';

describe('CondicionVentaComponent', () => {
  let component: CondicionVentaComponent;
  let fixture: ComponentFixture<CondicionVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CondicionVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CondicionVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
