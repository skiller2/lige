import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDescuentosStockComponent } from './table-descuentos-stock.component';

describe('TableDescuentosStockComponent', () => {
  let component: TableDescuentosStockComponent;
  let fixture: ComponentFixture<TableDescuentosStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableDescuentosStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableDescuentosStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});