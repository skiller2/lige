import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoDocumentoAltaDrawerComponent } from './tipo-documento-alta-drawer.component';

describe('TipoDocumentoAltaDrawerComponent', () => {
  let component: TipoDocumentoAltaDrawerComponent;
  let fixture: ComponentFixture<TipoDocumentoAltaDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoDocumentoAltaDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TipoDocumentoAltaDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});