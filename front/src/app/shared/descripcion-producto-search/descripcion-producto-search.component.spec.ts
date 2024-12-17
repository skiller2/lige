import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescripcionProductoSearchComponent } from './descripcion-producto-search.component';

describe('DescripcionProductoSearchComponent', () => {
  let component: DescripcionProductoSearchComponent;
  let fixture: ComponentFixture<DescripcionProductoSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DescripcionProductoSearchComponent]
    });
    fixture = TestBed.createComponent(DescripcionProductoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
