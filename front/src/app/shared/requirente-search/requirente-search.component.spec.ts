import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequirenteSearchComponent } from './requirente-search.component';

describe('RequirenteSearchComponent', () => {
  let component: RequirenteSearchComponent;
  let fixture: ComponentFixture<RequirenteSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequirenteSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequirenteSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});