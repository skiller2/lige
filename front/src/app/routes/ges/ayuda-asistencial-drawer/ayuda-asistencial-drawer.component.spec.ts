import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AyudaAsistencialDrawerComponent } from './ayuda-asistencial-drawer.component';

describe('AyudaAsistencialDrawerComponent', () => {
  let component: AyudaAsistencialDrawerComponent;
  let fixture: ComponentFixture<AyudaAsistencialDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AyudaAsistencialDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AyudaAsistencialDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});