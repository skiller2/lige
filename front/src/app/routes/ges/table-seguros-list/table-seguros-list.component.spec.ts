import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSeguroListComponent } from './table-seguros-list.component';

describe('TableSeguroListComponent', () => {
  let component: TableSeguroListComponent;
  let fixture: ComponentFixture<TableSeguroListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSeguroListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableSeguroListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
