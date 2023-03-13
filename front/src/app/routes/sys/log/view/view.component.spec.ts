import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SysLogViewComponent } from './view.component';

describe('SysLogViewComponent', () => {
  let component: SysLogViewComponent;
  let fixture: ComponentFixture<SysLogViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SysLogViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SysLogViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
