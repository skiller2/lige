import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorSearchComponent } from './administrador-search.component';

describe('ObjetivoSearchComponent', () => {
  let component: AdministradorSearchComponent;
  let fixture: ComponentFixture<AdministradorSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdministradorSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministradorSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
