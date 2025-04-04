import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalResponsableDrawerComponent } from './personal-responsable-drawer.component';

describe('PersonalResponsableDrawerComponent', () => {
  let component: PersonalResponsableDrawerComponent;
  let fixture: ComponentFixture<PersonalResponsableDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalResponsableDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalResponsableDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});