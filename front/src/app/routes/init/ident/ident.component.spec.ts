import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentComponent } from './ident.component';

describe('IdentComponent', () => {
  let component: IdentComponent;
  let fixture: ComponentFixture<IdentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IdentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
