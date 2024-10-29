import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccesoBotFormComponent } from './acceso-bot-form.component';

describe('AccesoBotFormComponent', () => {
  let component: AccesoBotFormComponent;
  let fixture: ComponentFixture<AccesoBotFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesoBotFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccesoBotFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
