import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratoComponent } from './contrato.component';

describe('ContratoComponent', () => {
  let component: ContratoComponent;
  let fixture: ComponentFixture<ContratoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
