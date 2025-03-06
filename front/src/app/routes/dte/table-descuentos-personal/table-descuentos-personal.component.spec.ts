import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDescuentosPersonalComponent } from './table-descuentos-personal.component';

describe('TableDescuentosPersonalComponent', () => {
  let component: TableDescuentosPersonalComponent;
  let fixture: ComponentFixture<TableDescuentosPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableDescuentosPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableDescuentosPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});