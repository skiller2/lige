import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalBancoDrawerComponent } from './personal-banco-drawer.component';

describe('PersonalBancoDrawerComponent', () => {
  let component: PersonalBancoDrawerComponent;
  let fixture: ComponentFixture<PersonalBancoDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalBancoDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalBancoDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});