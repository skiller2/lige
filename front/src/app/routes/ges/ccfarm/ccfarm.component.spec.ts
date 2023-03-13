import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { GesCcfarmComponent } from './ccfarm.component';

describe('GesCcfarmComponent', () => {
  let component: GesCcfarmComponent;
  let fixture: ComponentFixture<GesCcfarmComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [GesCcfarmComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(GesCcfarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
