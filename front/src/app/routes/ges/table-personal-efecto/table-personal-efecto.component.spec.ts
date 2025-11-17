import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePersonalEfectoComponent } from './table-personal-efecto.component';

describe('TablePersonalEfectoComponent', () => {
  let component: TablePersonalEfectoComponent;
  let fixture: ComponentFixture<TablePersonalEfectoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePersonalEfectoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablePersonalEfectoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
