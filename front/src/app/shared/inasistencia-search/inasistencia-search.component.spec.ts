import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InasistenciaSearchComponent } from './inasistencia-search.component';

describe('InasistenciaSearchComponent', () => {
  let component: InasistenciaSearchComponent;
  let fixture: ComponentFixture<InasistenciaSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InasistenciaSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InasistenciaSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
