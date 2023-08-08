import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteSearchComponent } from './cliente-search.component';

describe('PersonalSearchComponent', () => {
  let component: ClienteSearchComponent;
  let fixture: ComponentFixture<ClienteSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClienteSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
