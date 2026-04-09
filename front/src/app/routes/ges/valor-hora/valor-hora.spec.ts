import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValorHoraComponent } from './valor-hora';

describe('ValorHoraComponent', () => {
  let component: ValorHoraComponent;
  let fixture: ComponentFixture<ValorHoraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValorHoraComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ValorHoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
