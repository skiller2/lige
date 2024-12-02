import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalCustodiasDrawerComponent } from './personal-custodias-drawer.component';

describe('PersonalCustodiasDrawerComponent', () => {
  let component: PersonalCustodiasDrawerComponent;
  let fixture: ComponentFixture<PersonalCustodiasDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalCustodiasDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalCustodiasDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});