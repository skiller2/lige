import { Component, inject, signal, model, computed, ViewEncapsulation, input, effect, output, untracked, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { LoadingService } from '@delon/abc/loading';
import { applyEach, disabled, FieldTree, form, FormField, hidden, readonly, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ImpuestoTelefonia {
    ImpuestoInternoTelefoniaDesde: Date | null,
    ImpuestoInternoTelefoniaImpuesto: number,
}

@Component({
    selector: 'app-telefonia-impuesto-drawer',
    templateUrl: './telefonia-impuesto-drawer.html',
    styleUrl: './telefonia-impuesto-drawer.less',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, FormField],
    providers: [],
})
export class TelefoniaImpuestoDrawerComponent {
    placement: NzDrawerPlacement = 'left';
    isLoading = signal(false);
    visible = model<boolean>(false)
    onAddorUpdate = output()

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private readonly loadingSrv = inject(LoadingService);
    private defaultImpuestoTelefonia: ImpuestoTelefonia = { 
        ImpuestoInternoTelefoniaDesde: new Date(), 
        ImpuestoInternoTelefoniaImpuesto: NaN
    }
      
    readonly impuestoTelefonia = signal<ImpuestoTelefonia>(this.defaultImpuestoTelefonia);
    readonly formImpuestoTelefonia = form(this.impuestoTelefonia)

    loadEffect = effect(async () => {
        if (!this.visible()) return;

        this.impuestoTelefonia.update((state) => {
            return { ...state, ImpuestoInternoTelefoniaDesde: new Date()}
        })

        untracked(() => queueMicrotask(() => this.resetForm()));
    });

    async save() {
        await submit(this.formImpuestoTelefonia, async (form) => {
            let values = form().value()
            try {
                await firstValueFrom(this.apiService.setImpuestoTelefonia(values))
                this.onAddorUpdate.emit()
                form().reset()
            } catch (e) {

            }
        })
    }

    resetForm() {
        this.impuestoTelefonia.set(this.defaultImpuestoTelefonia)

        this.formImpuestoTelefonia().reset()
    }
}