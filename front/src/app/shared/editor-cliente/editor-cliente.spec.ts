import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorClienteComponent } from './editor-cliente';

describe('EditorClienteComponent', () => {
  let component: EditorClienteComponent;
  let fixture: ComponentFixture<EditorClienteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorClienteComponent]
    });
    fixture = TestBed.createComponent(EditorClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});