import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustodiaComponent } from './custodias.component';

describe('CargaAsistenciaComponent', () => {
  let component: CustodiaComponent;
  let fixture: ComponentFixture<CustodiaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustodiaComponent]
    });
    fixture = TestBed.createComponent(CustodiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});