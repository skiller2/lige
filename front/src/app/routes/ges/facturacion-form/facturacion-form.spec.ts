import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturacionFormComponent } from './facturacion-form';

describe('FacturacionFormComponent', () => {
  let component: FacturacionFormComponent;
  let fixture: ComponentFixture<FacturacionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturacionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturacionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
