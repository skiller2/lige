import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgPersComponent } from './imgpers.component';

describe('GesCcfarmComponent', () => {
  let component: ImgPersComponent;
  let fixture: ComponentFixture<ImgPersComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ImgPersComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ImgPersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
