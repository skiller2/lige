import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddrSearchComponent } from './addr-search.component';

describe('AddrSearchComponent', () => {
  let component: AddrSearchComponent;
  let fixture: ComponentFixture<AddrSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddrSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddrSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
