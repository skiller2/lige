import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolizaSeguroComponent } from './poliza-seguro.component';

describe('PolizaSeguroComponent', () => {
  let component: PolizaSeguroComponent;
  let fixture: ComponentFixture<PolizaSeguroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolizaSeguroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolizaSeguroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
