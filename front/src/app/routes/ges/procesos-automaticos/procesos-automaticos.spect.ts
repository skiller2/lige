import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesosAutomaticosComponent } from './procesos-automaticos';

describe('ProcesosAutomaticosComponent', () => {
  let component: ProcesosAutomaticosComponent;
  let fixture: ComponentFixture<ProcesosAutomaticosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesosAutomaticosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcesosAutomaticosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});