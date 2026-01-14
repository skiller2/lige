import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecibosModalComponent } from './recibos-modal'

describe('RecibosModalComponent', () => {
  let component: RecibosModalComponent;
  let fixture: ComponentFixture<RecibosModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecibosModalComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RecibosModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
