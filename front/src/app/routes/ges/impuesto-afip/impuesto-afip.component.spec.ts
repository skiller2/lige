import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpuestoAfipComponent } from './impuesto-afip.component';

describe('ImpuestoAfipComponent', () => {
  let component: ImpuestoAfipComponent;
  let fixture: ComponentFixture<ImpuestoAfipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpuestoAfipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpuestoAfipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
