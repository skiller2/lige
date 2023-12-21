import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorTipoCuentaComponent } from './editor-tipocuenta.component';

describe('EditorTipoCuentaComponent', () => {
  let component: EditorTipoCuentaComponent;
  let fixture: ComponentFixture<EditorTipoCuentaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorTipoCuentaComponent]
    });
    fixture = TestBed.createComponent(EditorTipoCuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
