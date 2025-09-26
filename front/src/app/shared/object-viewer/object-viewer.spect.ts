import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectViewerComponent } from './object-viewer';

describe('ObjectViewerComponent', () => {
  let component: ObjectViewerComponent;
  let fixture: ComponentFixture<ObjectViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ObjectViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});