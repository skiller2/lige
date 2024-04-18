import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalObjetivoComponnet } from './personal-objetivo.component';

describe('PersonalObjetivoComponnet', () => {
  let component: PersonalObjetivoComponnet;
  let fixture: ComponentFixture<PersonalObjetivoComponnet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalObjetivoComponnet]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalObjetivoComponnet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
