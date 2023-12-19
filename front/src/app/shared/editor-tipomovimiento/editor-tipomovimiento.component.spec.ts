import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorTipoMovimientoComponent } from './editor-tipomovimiento.component';

describe('EditorTipoMovimientoComponent', () => {
  let component: EditorTipoMovimientoComponent;
  let fixture: ComponentFixture<EditorTipoMovimientoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorTipoMovimientoComponent]
    });
    fixture = TestBed.createComponent(EditorTipoMovimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
