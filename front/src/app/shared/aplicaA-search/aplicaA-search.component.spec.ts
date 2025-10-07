import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AplicaASearchComponent } from './aplicaA-search.component';

describe('ObjetivoSearchComponent', () => {
  let component: AplicaASearchComponent;
  let fixture: ComponentFixture<AplicaASearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AplicaASearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AplicaASearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
