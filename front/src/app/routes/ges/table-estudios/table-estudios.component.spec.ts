import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableEstudiosComponent } from './table-estudios.component';

describe('TableEstudiosComponent', () => {
  let component: TableEstudiosComponent;
  let fixture: ComponentFixture<TableEstudiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableEstudiosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableEstudiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});