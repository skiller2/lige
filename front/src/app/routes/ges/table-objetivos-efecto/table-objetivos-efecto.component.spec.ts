import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableObjetivosEfectoComponent } from './table-objetivos-efecto.component';

describe('TableObjetivosEfectoComponent', () => {
  let component: TableObjetivosEfectoComponent;
  let fixture: ComponentFixture<TableObjetivosEfectoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableObjetivosEfectoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableObjetivosEfectoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
