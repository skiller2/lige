import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EfectoStockComponent } from './efecto-stock';

describe('EfectoStockComponent', () => {
  let component: EfectoStockComponent;
  let fixture: ComponentFixture<EfectoStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EfectoStockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EfectoStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
