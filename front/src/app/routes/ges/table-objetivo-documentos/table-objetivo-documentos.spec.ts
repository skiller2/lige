import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableObjetivoDocumentoComponent } from './table-objetivo-documentos';

describe('TableObjetivoDocumentoComponent', () => {
  let component: TableObjetivoDocumentoComponent;
  let fixture: ComponentFixture<TableObjetivoDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableObjetivoDocumentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableObjetivoDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});