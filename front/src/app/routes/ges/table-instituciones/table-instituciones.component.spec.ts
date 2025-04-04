import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableInstitucionesComponent } from './table-instituciones.component';

describe('TableInstitucionesComponent', () => {
  let component: TableInstitucionesComponent;
  let fixture: ComponentFixture<TableInstitucionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableInstitucionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableInstitucionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});