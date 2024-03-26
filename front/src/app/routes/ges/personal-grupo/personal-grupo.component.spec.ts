import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalGrupoComponent } from './personal-grupo.component';

describe('PersonalGrupoComponent', () => {
  let component: PersonalGrupoComponent;
  let fixture: ComponentFixture<PersonalGrupoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalGrupoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalGrupoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
