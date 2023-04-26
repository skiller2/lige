import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalSearchComponent } from './personal-search.component';

describe('PersonalSearchComponent', () => {
  let component: PersonalSearchComponent;
  let fixture: ComponentFixture<PersonalSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonalSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
