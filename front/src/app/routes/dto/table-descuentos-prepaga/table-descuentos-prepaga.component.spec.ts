import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDescuentosPrepagaComponent } from './table-descuentos-prepaga.component';

describe('TableDescuentosPrepagaComponent', () => {
  let component: TableDescuentosPrepagaComponent;
  let fixture: ComponentFixture<TableDescuentosPrepagaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableDescuentosPrepagaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableDescuentosPrepagaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});