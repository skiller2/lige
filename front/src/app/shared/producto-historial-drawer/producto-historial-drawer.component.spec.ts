import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoHistorialDrawerComponent } from './producto-historial-drawer.component';

describe('LicenciaHistorialDrawerComponent', () => {
  let component: ProductoHistorialDrawerComponent;
  let fixture: ComponentFixture<ProductoHistorialDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoHistorialDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductoHistorialDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
