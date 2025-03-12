import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosAltaDrawerComponent } from './descuentos-alta-drawer.component';

describe('DescuentosAltaDrawerComponent', () => {
  let component: DescuentosAltaDrawerComponent;
  let fixture: ComponentFixture<DescuentosAltaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosAltaDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosAltaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});