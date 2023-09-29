import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorPersonaComponent } from './editor-persona.component';

describe('EditorPersonaComponent', () => {
  let component: EditorPersonaComponent;
  let fixture: ComponentFixture<EditorPersonaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorPersonaComponent]
    });
    fixture = TestBed.createComponent(EditorPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
