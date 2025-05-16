import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosPersonalAltaDrawerComponent } from './descuentos-personal-alta-drawer.component';

describe('DescuentosPersonalAltaDrawerComponent', () => {
  let component: DescuentosPersonalAltaDrawerComponent;
  let fixture: ComponentFixture<DescuentosPersonalAltaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosPersonalAltaDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosPersonalAltaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});