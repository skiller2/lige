import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatosBotDrawerComponent } from './datos-bot-drawer

describe('DatosBotDrawerComponent', () => {
  let component: DatosBotDrawerComponent;
  let fixture: ComponentFixture<DatosBotDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatosBotDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatosBotDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
