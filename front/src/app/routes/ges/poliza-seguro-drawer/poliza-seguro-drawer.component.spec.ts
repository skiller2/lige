import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolizaSeguroDrawerComponent } from './poliza-seguro-drawer.component';

describe('PolizaSeguroDrawerComponent', () => {
  let component: PolizaSeguroDrawerComponent;
  let fixture: ComponentFixture<PolizaSeguroDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolizaSeguroDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolizaSeguroDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
