import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoAsociadoCategoriaSearchComponent } from './tipo-asociado-categoria-search';

describe('TipoAsociadoCategoriaSearchComponent', () => {
  let component: TipoAsociadoCategoriaSearchComponent;
  let fixture: ComponentFixture<TipoAsociadoCategoriaSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoAsociadoCategoriaSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoAsociadoCategoriaSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

