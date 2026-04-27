import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelefoniaImpuestoDrawerComponent } from './telefonia-impuesto-drawer';

describe('TelefoniaImpuestoDrawerComponent', () => {
  let component: TelefoniaImpuestoDrawerComponent;
  let fixture: ComponentFixture<TelefoniaImpuestoDrawerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TelefoniaImpuestoDrawerComponent]
    });
    fixture = TestBed.createComponent(TelefoniaImpuestoDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});