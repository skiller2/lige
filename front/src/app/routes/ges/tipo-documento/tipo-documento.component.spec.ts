import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoDocumentoComponent } from './tipo-documento.component';

describe('CategoriasComponent', () => {
  let component: TipoDocumentoComponent;
  let fixture: ComponentFixture<TipoDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TipoDocumentoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
