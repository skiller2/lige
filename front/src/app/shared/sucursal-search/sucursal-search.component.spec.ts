import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SucursalSearchComponent } from './sucursal-search.component';

describe('SucursalSearchComponent', () => {
  let component: SucursalSearchComponent;
  let fixture: ComponentFixture<SucursalSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SucursalSearchComponent]
    });
    fixture = TestBed.createComponent(SucursalSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
