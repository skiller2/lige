import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FechaSearchComponent } from './fecha-search.component';

describe('FechaComponent', () => {
  let component: FechaSearchComponent;
  let fixture: ComponentFixture<FechaSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ FechaSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FechaSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});