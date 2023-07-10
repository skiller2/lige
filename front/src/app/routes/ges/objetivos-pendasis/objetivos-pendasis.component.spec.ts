import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetivosPendAsisComponent } from './objetivos-pendasis.component';

describe('CategoriasComponent', () => {
  let component: ObjetivosPendAsisComponent;
  let fixture: ComponentFixture<ObjetivosPendAsisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjetivosPendAsisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjetivosPendAsisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
