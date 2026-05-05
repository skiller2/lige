import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoLogDetalleComponent } from './evento-log-detalle';

describe('EventoLogDetalleComponent', () => {
  let component: EventoLogDetalleComponent;
  let fixture: ComponentFixture<EventoLogDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoLogDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventoLogDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});