import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalExencionesDrawerComponent } from './personal-exenciones-drawer';

describe('PersonalExencionesDrawerComponent', () => {
  let component: PersonalExencionesDrawerComponent;
  let fixture: ComponentFixture<PersonalExencionesDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalExencionesDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalExencionesDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});