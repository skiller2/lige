import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewResponsableComponent } from './view-responsable.component';

describe('ViewResponsableComponent', () => {
  let component: ViewResponsableComponent;
  let fixture: ComponentFixture<ViewResponsableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewResponsableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewResponsableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
