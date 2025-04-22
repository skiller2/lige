import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentoComponent } from './documento.component';

describe('CategoriasComponent', () => {
  let component: DocumentoComponent;
  let fixture: ComponentFixture<DocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
