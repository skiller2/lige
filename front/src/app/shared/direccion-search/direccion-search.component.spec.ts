import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DireccionSearchComponent } from './direccion-search.component';

describe('DireccionSearchComponent', () => {
  let component: DireccionSearchComponent;
  let fixture: ComponentFixture<DireccionSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DireccionSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DireccionSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
