import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfRetiroComponent } from './pdf-retiro.component';

describe('PdfRetiroComponent', () => {
  let component: PdfRetiroComponent;
  let fixture: ComponentFixture<PdfRetiroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfRetiroComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfRetiroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
