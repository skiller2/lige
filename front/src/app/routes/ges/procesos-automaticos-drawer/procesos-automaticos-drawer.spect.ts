import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesosAutomaticosDrawerComponent } from './procesos-automaticos-drawer';

describe('ProcesosAutomaticosDrawerComponent', () => {
  let component: ProcesosAutomaticosDrawerComponent;
  let fixture: ComponentFixture<ProcesosAutomaticosDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesosAutomaticosDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcesosAutomaticosDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});