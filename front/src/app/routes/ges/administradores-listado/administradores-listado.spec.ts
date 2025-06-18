import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradoresListadoComponent } from './administradores-listado';

describe('AdministradoresListadoComponent', () => {
  let component: AdministradoresListadoComponent;
  let fixture: ComponentFixture<AdministradoresListadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradoresListadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministradoresListadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
