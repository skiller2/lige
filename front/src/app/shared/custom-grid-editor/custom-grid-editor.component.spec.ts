import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomGridEditorComponent } from './custom-grid-editor.component';

describe('PersonaGridEditorComponent', () => {
  let component: CustomGridEditorComponent;
  let fixture: ComponentFixture<CustomGridEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomGridEditorComponent]
    });
    fixture = TestBed.createComponent(CustomGridEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
