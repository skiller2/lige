import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableClienteDocumentoComponent } from './table-cliente-documentos';

describe('TableClienteDocumentoComponent', () => {
  let component: TableClienteDocumentoComponent;
  let fixture: ComponentFixture<TableClienteDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableClienteDocumentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableClienteDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});