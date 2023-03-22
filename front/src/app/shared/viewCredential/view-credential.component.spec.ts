import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCredentialComponent } from './view-credential.component';

describe('ViewCredentialComponent', () => {
  let component: ViewCredentialComponent;
  let fixture: ComponentFixture<ViewCredentialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewCredentialComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
