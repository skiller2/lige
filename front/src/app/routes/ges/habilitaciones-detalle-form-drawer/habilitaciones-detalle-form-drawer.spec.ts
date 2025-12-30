import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabilitacionesFormDrawerComponent } from './habilitaciones-detalle-form-drawer';

describe('HabilitacionesFormDrawerComponent', () => {
  let component: HabilitacionesFormDrawerComponent;
  let fixture: ComponentFixture<HabilitacionesFormDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabilitacionesFormDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabilitacionesFormDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});