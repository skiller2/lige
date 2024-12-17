import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreciosProductosComponent } from './precios-productos.component';

describe('PreciosProductosComponent', () => {
  let component: PreciosProductosComponent;
  let fixture: ComponentFixture<PreciosProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreciosProductosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreciosProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
