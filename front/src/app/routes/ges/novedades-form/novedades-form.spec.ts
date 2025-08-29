import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovedadesFormComponent } from './novedades-form';

describe('NovedadesFormComponent', () => {
  let component: NovedadesFormComponent;
  let fixture: ComponentFixture<NovedadesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovedadesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovedadesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
