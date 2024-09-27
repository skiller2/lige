import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustodiaFormComponent } from './custodias-form.component';

describe('CustodiaFormComponent', () => {
  let component: CustodiaFormComponent;
  let fixture: ComponentFixture<CustodiaFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustodiaFormComponent]
    });
    fixture = TestBed.createComponent(CustodiaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});