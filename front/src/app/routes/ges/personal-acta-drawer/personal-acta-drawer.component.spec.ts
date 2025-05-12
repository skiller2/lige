import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalActaDrawerComponent } from './personal-acta-drawer.component';

describe('PersonalActaDrawerComponent', () => {
  let component: PersonalActaDrawerComponent;
  let fixture: ComponentFixture<PersonalActaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalActaDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalActaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});