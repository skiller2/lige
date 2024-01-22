import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePersonaComponent } from './detalle-persona.component';

describe('DetallePersonaComponent', () => {
  let component: DetallePersonaComponent;
  let fixture: ComponentFixture<DetallePersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePersonaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetallePersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
