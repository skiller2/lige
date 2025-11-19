import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberAdvancedSearchComponent } from './number-advanced-search';

describe('FechaComponent', () => {
  let component: NumberAdvancedSearchComponent;
  let fixture: ComponentFixture<NumberAdvancedSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NumberAdvancedSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberAdvancedSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});