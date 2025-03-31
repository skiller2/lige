import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SedesDrawerComponent } from './sedes-drawer.component';

describe('SedesDrawerComponent', () => {
  let component: SedesDrawerComponent;
  let fixture: ComponentFixture<SedesDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SedesDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SedesDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 