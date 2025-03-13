import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudioSearchComponent } from './estudio-search.component';

describe('EstudioSearchComponent', () => {
  let component: EstudioSearchComponent;
  let fixture: ComponentFixture<EstudioSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EstudioSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudioSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 