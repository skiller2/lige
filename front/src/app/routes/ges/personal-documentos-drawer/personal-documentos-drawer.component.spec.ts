import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDocumentosDrawerComponent } from './personal-documentos-drawer.component';

describe('PersonalDocumentosDrawerComponent', () => {
  let component: PersonalDocumentosDrawerComponent;
  let fixture: ComponentFixture<PersonalDocumentosDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDocumentosDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalDocumentosDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});