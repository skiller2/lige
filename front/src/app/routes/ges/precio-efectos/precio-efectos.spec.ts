import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecioEfectosComponent } from './precio-efectos';

describe('PrecioEfectosComponent', () => {
  let component: PrecioEfectosComponent;
  let fixture: ComponentFixture<PrecioEfectosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrecioEfectosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrecioEfectosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
