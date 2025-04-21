import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentoDrawerComponent } from './documento-drawer.component';

describe('DocumentoDrawerComponent', () => {
  let component: DocumentoDrawerComponent;
  let fixture: ComponentFixture<DocumentoDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentoDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentoDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});