import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableBloqueadasComponent } from './table-locked '

describe('TableBloqueadasComponent', () => {
  let component: TableBloqueadasComponent;
  let fixture: ComponentFixture<TableBloqueadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableBloqueadasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableBloqueadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
