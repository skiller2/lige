import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditoriaRegistroComponent } from './auditoria-registro';

describe('AuditoriaRegistroComponent', () => {
  let component: AuditoriaRegistroComponent;
  let fixture: ComponentFixture<AuditoriaRegistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditoriaRegistroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditoriaRegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
