import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosImportacionMasivaComponent } from './productos-importacion-masiva';

describe('ProductosImportacionMasivaComponent', () => {
  let component: ProductosImportacionMasivaComponent;
  let fixture: ComponentFixture<ProductosImportacionMasivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosImportacionMasivaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosImportacionMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});