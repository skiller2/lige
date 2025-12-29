import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EfectoSearchComponent } from './efecto-search';

describe('EfectoSearchComponent', () => {
  let component: EfectoSearchComponent;
  let fixture: ComponentFixture<EfectoSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EfectoSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EfectoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
