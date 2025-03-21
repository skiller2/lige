import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CursosDrawerComponent } from './cursos-drawer.component';

describe('CursosDrawerComponent', () => {
  let component: CursosDrawerComponent;
  let fixture: ComponentFixture<CursosDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CursosDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CursosDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 