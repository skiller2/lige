import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoMovimientoSearchComponent } from './tipo-movimiento-search.component';

describe('TipoMovimientoComponent', () => {
  let component: TipoMovimientoSearchComponent;
  let fixture: ComponentFixture<TipoMovimientoSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TipoMovimientoSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoMovimientoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});