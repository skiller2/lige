import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredencialListaComponent } from './credencial-lista.component';

describe('CredencialListaComponent', () => {
  let component: CredencialListaComponent;
  let fixture: ComponentFixture<CredencialListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CredencialListaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CredencialListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
