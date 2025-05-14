import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosObjetivosAltaDrawerComponent } from './descuentos-objetivos-alta-drawer.component';

describe('DescuentosObjetivosAltaDrawerComponent', () => {
  let component: DescuentosObjetivosAltaDrawerComponent;
  let fixture: ComponentFixture<DescuentosObjetivosAltaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosObjetivosAltaDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosObjetivosAltaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});