import { Component, ElementRef, inject } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';

@Component({
    selector: 'app-editor-efecto',
    templateUrl: './editor-efecto.html',
    styleUrls: ['./editor-efecto.less'],
    imports: [
      ...SHARED_IMPORTS,
      CommonModule
    ]
})
export class EditorEfectoComponent {

  private searchService = inject(SearchService);

  selectedId: number = 0;
  selectedItem: any;
  collection?: any[];
  onItemChanged = new Subject<any>();
  item: any; // current row data from grid
  efectoOptions: any[] = [];
  isLoading = false;

  constructor(public element: ElementRef) {}

  async ngOnInit() {
    this.element.nativeElement.addEventListener('keydown', this.onKeydown.bind(this));
    await this.loadEfectos();
  }

  async loadEfectos() {
    const objetivoId = this.item?.ClienteElementoDependienteDescripcion?.id || 0;
    const personalId = this.item?.ApellidoNombre?.id || 0;

    if (objetivoId > 0) {
      this.isLoading = true;
      try {
        this.efectoOptions = await firstValueFrom(this.searchService.getEfectoByObjetivoId(objetivoId)) || [];
      } catch {
        this.efectoOptions = [];
      }
      this.isLoading = false;
    } else if (personalId > 0) {
      this.isLoading = true;
      try {
        this.efectoOptions = await firstValueFrom(this.searchService.getEfectoByPersonalId(personalId)) || [];
      } catch {
        this.efectoOptions = [];
      }
      this.isLoading = false;
    } else {
      this.efectoOptions = [];
    }
  }

  onChange(value: any) {
    if (!value) {
      this.selectedId = 0;
      this.selectedItem = { id: 0, fullName: '', EfectoId: 0, EfectoIndividualId: 0 };
      return;
    }
    const efecto = this.efectoOptions.find((e: any) => e.EfectoId === value);
    if (efecto) {
      this.selectedId = efecto.EfectoId;
      this.selectedItem = {
        id: efecto.EfectoId,
        fullName: efecto.EfectoDescripcionCompleta || efecto.EfectoDescripcion,
        EfectoId: efecto.EfectoId,
        EfectoIndividualId: efecto.EfectoIndividualId
      };
    }
  }

  focus() {}

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
    }
  }

  ngOnDestroy() {
    this.element.nativeElement.removeEventListener('keydown', this.onKeydown.bind(this));
  }
}
