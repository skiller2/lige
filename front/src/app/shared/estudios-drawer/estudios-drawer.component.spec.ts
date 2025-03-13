import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudiosDrawerComponent } from './estudios-drawer.component';

describe('EstudiosDrawerComponent', () => {
  let component: EstudiosDrawerComponent;
  let fixture: ComponentFixture<EstudiosDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudiosDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EstudiosDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 