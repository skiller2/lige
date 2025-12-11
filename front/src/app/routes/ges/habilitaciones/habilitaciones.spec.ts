import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabilitacionesComponent } from './habilitaciones';

describe('HabilitacionesComponent', () => {
  let component: HabilitacionesComponent;
  let fixture: ComponentFixture<HabilitacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabilitacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabilitacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});