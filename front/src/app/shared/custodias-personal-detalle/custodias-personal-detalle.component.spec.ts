import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustodiasPersonalDetalleComponent } from './custodias-personal-detalle.component';

describe('CustodiasPersonalDetalleComponent', () => {
  let component: CustodiasPersonalDetalleComponent;
  let fixture: ComponentFixture<CustodiasPersonalDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustodiasPersonalDetalleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustodiasPersonalDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});