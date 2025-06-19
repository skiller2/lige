import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradoresClientesTableComponent } from './administradores-clientes-table';

describe('AdministradoresClientesTableComponent', () => {
  let component: AdministradoresClientesTableComponent;
  let fixture: ComponentFixture<AdministradoresClientesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradoresClientesTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministradoresClientesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
