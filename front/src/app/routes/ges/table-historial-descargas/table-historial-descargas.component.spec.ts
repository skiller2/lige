import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHistorialDescargasComponent } from './table-historial-descargas.component';

describe('TableHistorialDescargasComponent', () => {
  let component: TableHistorialDescargasComponent;
  let fixture: ComponentFixture<TableHistorialDescargasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableHistorialDescargasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableHistorialDescargasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});