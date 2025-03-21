import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalidadCursoSearchComponent } from './modalidad-curso-search.component';

describe('ModalidadCursoSearchComponent', () => {
  let component: ModalidadCursoSearchComponent;
  let fixture: ComponentFixture<ModalidadCursoSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalidadCursoSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalidadCursoSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 