import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosBajaImportacionDrawer } from './descuentos-baja-importacion-drawer';

describe('DescuentosBajaImportacionDrawer', () => {
  let component: DescuentosBajaImportacionDrawer;
  let fixture: ComponentFixture<DescuentosBajaImportacionDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosBajaImportacionDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosBajaImportacionDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});