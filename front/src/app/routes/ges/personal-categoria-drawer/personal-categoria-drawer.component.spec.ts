import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalCategoriaDrawerComponent } from './personal-categoria-drawer.component';

describe('PersonalCategoriaDrawerComponent', () => {
  let component: PersonalCategoriaDrawerComponent;
  let fixture: ComponentFixture<PersonalCategoriaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalCategoriaDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalCategoriaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});