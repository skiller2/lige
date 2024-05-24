import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPermisocargaComponent } from './lista-permisocarga.component';

describe('ListaPermisocargaComponent', () => {
  let component: ListaPermisocargaComponent;
  let fixture: ComponentFixture<ListaPermisocargaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPermisocargaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaPermisocargaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
