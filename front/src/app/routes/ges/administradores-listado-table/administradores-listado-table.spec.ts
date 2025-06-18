import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradoresListadoTableComponent } from './administradores-listado-table';

describe('AdministradoresListadoTableComponent', () => {
  let component: AdministradoresListadoTableComponent;
  let fixture: ComponentFixture<AdministradoresListadoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradoresListadoTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministradoresListadoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
