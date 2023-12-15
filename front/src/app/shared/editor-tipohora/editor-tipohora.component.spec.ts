import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorPersonaComponent } from './editor-tipohora.component';

describe('EditorPersonaComponent', () => {
  let component: EditorTipoHoraComponent;
  let fixture: ComponentFixture<EditorTipoHoraComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorTipoHoraComponent]
    });
    fixture = TestBed.createComponent(EditorTipoHoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
