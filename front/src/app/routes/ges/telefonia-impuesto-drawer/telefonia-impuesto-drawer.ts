import { Component, inject, signal, model, computed, ViewEncapsulation, input, effect, output, untracked, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
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

    private apiService = inject(ApiService)
    private readonly defaultImpuestoTelefonia: ImpuestoTelefonia = { 
        ImpuestoInternoTelefoniaDesde: null, 
        ImpuestoInternoTelefoniaImpuesto: NaN
    }
      
    readonly impuestoTelefonia = signal<ImpuestoTelefonia>(this.defaultImpuestoTelefonia);
    readonly formImpuestoTelefonia = form(this.impuestoTelefonia)

    loadEffect = effect(() => {
        if (!this.visible()) return;

        const now = new Date();
        const anio = Number(localStorage.getItem('anio')) > 0 ? localStorage.getItem('anio') : now.getFullYear();
        const mes = Number(localStorage.getItem('mes')) > 0 ? localStorage.getItem('mes') : now.getMonth() + 1;
        // console.log('anio: ', anio);
        // console.log('mes: ', mes);
        // console.log(new Date(Number(anio), Number(mes) - 1, 1));
        
        this.impuestoTelefonia.update((state) => {
            return { ...state, ImpuestoInternoTelefoniaDesde: new Date(Number(anio), Number(mes) - 1, 1)}
        })

        untracked(() => queueMicrotask(() => this.formImpuestoTelefonia().reset()));
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

}