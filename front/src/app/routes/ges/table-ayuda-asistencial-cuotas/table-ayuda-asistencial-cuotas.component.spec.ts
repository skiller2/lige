import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableAyudaAsistencialCuotasComponent } from './table-ayuda-asistencial-cuotas.component';

describe('TableAyudaAsistencialCuotasComponent', () => {
  let component: TableAyudaAsistencialCuotasComponent;
  let fixture: ComponentFixture<TableAyudaAsistencialCuotasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableAyudaAsistencialCuotasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableAyudaAsistencialCuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
