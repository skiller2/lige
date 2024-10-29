import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccesoBotComponent } from './acceso-bot.component';

describe('AccesoBotComponent', () => {
  let component: AccesoBotComponent;
  let fixture: ComponentFixture<AccesoBotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesoBotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccesoBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
