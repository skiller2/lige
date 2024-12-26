import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectSearchComponent } from './select-search.component';

describe('DescripcionProductoSearchComponent', () => {
  let component: SelectSearchComponent;
  let fixture: ComponentFixture<SelectSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SelectSearchComponent]
    });
    fixture = TestBed.createComponent(SelectSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
