import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenciaDrawerComponent } from './licencia-drawer.component';

describe('LicenciaDrawerComponent', () => {
  let component: LicenciaDrawerComponent;
  let fixture: ComponentFixture<LicenciaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicenciaDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LicenciaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
