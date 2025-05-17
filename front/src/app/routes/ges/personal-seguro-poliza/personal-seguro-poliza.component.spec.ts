import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalSeguroPolizaComponent } from './personal-seguro-poliza.component';

describe('PersonalSeguroPolizaComponent', () => {
  let component: PersonalSeguroPolizaComponent;
  let fixture: ComponentFixture<PersonalSeguroPolizaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalSeguroPolizaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalSeguroPolizaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
