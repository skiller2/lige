import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabilitacionNecesariaFormModalComponent } from './habilitacion-necesaria-form-modal';

describe('HabilitacionNecesariaFormModalComponent', () => {
  let component: HabilitacionNecesariaFormModalComponent;
  let fixture: ComponentFixture<HabilitacionNecesariaFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabilitacionNecesariaFormModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabilitacionNecesariaFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});