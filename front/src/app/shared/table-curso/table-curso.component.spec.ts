import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCursoComponent } from './table-curso.component';

describe('TableCursoComponent', () => {
  let component: TableCursoComponent;
  let fixture: ComponentFixture<TableCursoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCursoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableCursoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});