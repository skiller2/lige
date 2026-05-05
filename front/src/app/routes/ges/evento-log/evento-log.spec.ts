import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoLogComponent } from './evento-log';

describe('EventoLogComponent', () => {
  let component: EventoLogComponent;
  let fixture: ComponentFixture<EventoLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventoLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});