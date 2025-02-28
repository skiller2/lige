import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguroSearchComponent } from './seguro-search.component';

describe('SeguroSearchComponent', () => {
  let component: SeguroSearchComponent;
  let fixture: ComponentFixture<SeguroSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeguroSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeguroSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
