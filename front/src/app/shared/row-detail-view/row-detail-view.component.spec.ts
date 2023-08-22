import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowDetailViewComponent } from './row-detail-view.component';

describe('RowDetailViewComponent', () => {
  let component: RowDetailViewComponent;
  let fixture: ComponentFixture<RowDetailViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RowDetailViewComponent]
    });
    fixture = TestBed.createComponent(RowDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
