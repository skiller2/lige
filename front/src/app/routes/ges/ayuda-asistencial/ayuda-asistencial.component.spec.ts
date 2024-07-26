import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AyudaAsistencialComponent } from './ayuda-asistencial.component';

describe('AyudaAsistencialComponent', () => {
  let component: AyudaAsistencialComponent;
  let fixture: ComponentFixture<AyudaAsistencialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AyudaAsistencialComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AyudaAsistencialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
