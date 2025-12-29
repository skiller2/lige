import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EfectoIndividualSearchComponent } from './efecto-individual-search';

describe('EfectoIndividualSearchComponent', () => {
  let component: EfectoIndividualSearchComponent;
  let fixture: ComponentFixture<EfectoIndividualSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EfectoIndividualSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EfectoIndividualSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
