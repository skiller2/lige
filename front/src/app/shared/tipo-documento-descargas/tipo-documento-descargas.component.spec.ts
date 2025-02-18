import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoDocumentoDescargasComponent } from './tipo-documento-descargas.component';

describe('TipoDocumentoDescargasComponent', () => {
  let component: TipoDocumentoDescargasComponent;
  let fixture: ComponentFixture<TipoDocumentoDescargasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoDocumentoDescargasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TipoDocumentoDescargasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});