import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturacionComponent } from './facturacion';

describe('FacturacionComponent', () => {
  let component: FacturacionComponent;
  let fixture: ComponentFixture<FacturacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
