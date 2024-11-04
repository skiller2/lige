import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustodiasPersonalDrawerComponent } from './custodias-personal-drawer.component';

describe('CustodiasPersonalDrawerComponent', () => {
  let component: CustodiasPersonalDrawerComponent;
  let fixture: ComponentFixture<CustodiasPersonalDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustodiasPersonalDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustodiasPersonalDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});