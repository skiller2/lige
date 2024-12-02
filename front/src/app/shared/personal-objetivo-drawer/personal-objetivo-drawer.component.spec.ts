import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalObjetivoDrawerComponent } from './personal-objetivo-drawer.component';

describe('PersonalObjetivoDrawerComponent', () => {
  let component: PersonalObjetivoDrawerComponent;
  let fixture: ComponentFixture<PersonalObjetivoDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalObjetivoDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalObjetivoDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});