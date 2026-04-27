import { Component, inject, signal, model, computed, ViewEncapsulation, input, effect, output, untracked, resource } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom, Observable, forkJoin } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { LoadingService } from '@delon/abc/loading';
import { applyEach, disabled, FieldTree, form, FormField, hidden, readonly, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-telefonia-impuesto-drawer',
    templateUrl: './telefonia-impuesto-drawer.html',
    styleUrl: './telefonia-impuesto-drawer.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, FormField],
    providers: [],
})
export class TelefoniaImpuestoDrawerComponent {
    isLoading = signal(false);
    visible = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private readonly loadingSrv = inject(LoadingService);
}