import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CredPersComponent } from './credpers.component';

describe('CredPersComponent', () => {
  let component: CredPersComponent;
  let fixture: ComponentFixture<CredPersComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CredPersComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CredPersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
