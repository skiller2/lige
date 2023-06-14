import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroBuilderComponent } from './filtro-builder.component';

describe('FiltroBuilderComponent', () => {
  let component: FiltroBuilderComponent;
  let fixture: ComponentFixture<FiltroBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ FiltroBuilderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltroBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
