import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowPreloadDetailComponent } from './row-preload-detail.component';

describe('RowPreloadDetailComponent', () => {
  let component: RowPreloadDetailComponent;
  let fixture: ComponentFixture<RowPreloadDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RowPreloadDetailComponent]
    });
    fixture = TestBed.createComponent(RowPreloadDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
