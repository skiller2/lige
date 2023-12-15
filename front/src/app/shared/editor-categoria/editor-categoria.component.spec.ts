import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorCategoriaComponent } from './editor-categoria.component';

describe('EditorPersonaComponent', () => {
  let component: EditorCategoriaComponent;
  let fixture: ComponentFixture<EditorCategoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorCategoriaComponent]
    });
    fixture = TestBed.createComponent(EditorCategoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
