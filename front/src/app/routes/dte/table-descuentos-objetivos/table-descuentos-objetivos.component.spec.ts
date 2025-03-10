import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDescuentosObjetivosComponent } from './table-descuentos-objetivos.component';

describe('TableDescuentosObjetivosComponent', () => {
  let component: TableDescuentosObjetivosComponent;
  let fixture: ComponentFixture<TableDescuentosObjetivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableDescuentosObjetivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableDescuentosObjetivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});