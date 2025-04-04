import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalSituacionRevistaDrawerComponent } from './personal-situacionrevista-drawer.component';

describe('PersonalSituacionRevistaDrawerComponent', () => {
  let component: PersonalSituacionRevistaDrawerComponent;
  let fixture: ComponentFixture<PersonalSituacionRevistaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalSituacionRevistaDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalSituacionRevistaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});