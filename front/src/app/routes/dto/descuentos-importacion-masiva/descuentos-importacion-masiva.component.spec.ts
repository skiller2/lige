import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentosImportacionMasivaComponent } from './descuentos-importacion-masiva.component';

describe('DescuentosImportacionMasivaComponent', () => {
  let component: DescuentosImportacionMasivaComponent;
  let fixture: ComponentFixture<DescuentosImportacionMasivaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescuentosImportacionMasivaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescuentosImportacionMasivaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});