import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredencialPersonalComponent } from './credencial-personal.component';

describe('CredencialPersonalComponent', () => {
  let component: CredencialPersonalComponent;
  let fixture: ComponentFixture<CredencialPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CredencialPersonalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CredencialPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
