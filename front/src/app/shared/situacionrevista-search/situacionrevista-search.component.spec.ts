import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SituacionRevistaSearchComponent } from './situacionrevista-search.component';

describe('SituacionRevistaSearchComponent', () => {
  let component: SituacionRevistaSearchComponent;
  let fixture: ComponentFixture<SituacionRevistaSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SituacionRevistaSearchComponent]
    });
    fixture = TestBed.createComponent(SituacionRevistaSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
