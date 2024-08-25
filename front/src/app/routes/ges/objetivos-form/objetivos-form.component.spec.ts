import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetivosFormComponent } from './objetivos-form.component';

describe('ClientesFormComponent', () => {
  let component: ObjetivosFormComponent;
  let fixture: ComponentFixture<ObjetivosFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjetivosFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjetivosFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
