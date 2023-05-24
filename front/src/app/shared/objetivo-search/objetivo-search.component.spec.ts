import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetivoSearchComponent } from './objetivo-search.component';

describe('ObjetivoSearchComponent', () => {
  let component: ObjetivoSearchComponent;
  let fixture: ComponentFixture<ObjetivoSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjetivoSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjetivoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
