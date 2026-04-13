import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, output, untracked, resource } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom, Observable, forkJoin } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { LoadingService } from '@delon/abc/loading';

@Component({
  selector: 'app-descuentos-baja-importacion-drawer',
  templateUrl: './descuentos-baja-importacion-drawer.html',
  styleUrl: './descuentos-baja-importacion-drawer.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule],
})

export class DescuentosBajaImportacionDrawer {
  DocumentoId = input<number>(0);
  visibleBajaImport = model<boolean>(false);
  isLoading = signal(false);
  placement: NzDrawerPlacement = 'right';

  private apiService = inject(ApiService)

  descuentoImportacionDetalle = resource({
    params: () => this.DocumentoId(),

    loader: async ({ params: DocumentoId }) => {
      
      if (!DocumentoId) {
          return [];
      }

      return await firstValueFrom(this.apiService.getDescuentosImportacionDetalle(DocumentoId))
      
    }
  });
}