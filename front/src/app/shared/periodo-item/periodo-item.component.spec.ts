import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodoItemComponent } from './periodo-item.component';

describe('PeriodoItemComponent', () => {
  let component: PeriodoItemComponent;
  let fixture: ComponentFixture<PeriodoItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PeriodoItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodoItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
