import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorObjetivoComponent } from './editor-objetivo.component';

describe('EditorObjetivoComponent', () => {
  let component: EditorObjetivoComponent;
  let fixture: ComponentFixture<EditorObjetivoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorObjetivoComponent]
    });
    fixture = TestBed.createComponent(EditorObjetivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
