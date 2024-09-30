import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RubroSearchComponent } from './rubro-search.component';

describe('RubroSearchComponent', () => {
  let component: RubroSearchComponent;
  let fixture: ComponentFixture<RubroSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RubroSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RubroSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
