import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatenteSearchComponent } from './patente-search.component';

describe('PersonalSearchComponent', () => {
  let component: PatenteSearchComponent;
  let fixture: ComponentFixture<PatenteSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatenteSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatenteSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});