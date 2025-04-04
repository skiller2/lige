import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDomicilioDrawerComponent } from './personal-domicilio-drawer.component';

describe('PersonalDomicilioDrawerComponent', () => {
  let component: PersonalDomicilioDrawerComponent;
  let fixture: ComponentFixture<PersonalDomicilioDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDomicilioDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalDomicilioDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});