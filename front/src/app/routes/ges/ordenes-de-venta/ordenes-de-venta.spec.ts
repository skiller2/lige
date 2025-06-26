import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdenesDeVentaComponent } from './ordenes-de-venta.component';

describe('OrdenesDeVentaComponent', () => {
  let component: OrdenesDeVentaComponent;
  let fixture: ComponentFixture<OrdenesDeVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenesDeVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenesDeVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
