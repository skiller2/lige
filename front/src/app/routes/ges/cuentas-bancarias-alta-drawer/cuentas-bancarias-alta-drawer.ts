import { Component, inject, signal, model, resource, input, computed, effect, output } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

export interface CuentasBancarias {
    BancoId: number,
    Desde: Date|null,
    CUITs: string, 
}

@Component({
    selector: 'app-cuentas-bancarias-alta-drawer',
    templateUrl: './cuentas-bancarias-alta-drawer.html',
    styleUrl: './cuentas-bancarias-alta-drawer.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, FormField, FormsModule],
    providers: [AngularUtilService]
})
  
export class CuentasBancariasAltaDrawerComponent {
    visible = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    onAddorUpdate = output()

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)

    private readonly defaultCuentasBancariasForm: CuentasBancarias = { 
        BancoId: 0, 
        Desde: new Date(),
        CUITs: '', 
    }
    
    readonly cuentasBancarias = signal<CuentasBancarias>(this.defaultCuentasBancariasForm)
    readonly formCuentasBancarias = form(this.cuentasBancarias)

    optionsBanco = toSignal(this.searchService.getBancosOptions())

    async ngOnInit(){
    }

    async save() {
        await submit(this.formCuentasBancarias, async (form) => {
            const values: CuentasBancarias = form().value()
            try {
                await firstValueFrom(this.apiService.addCuentasBancarias(values))
                this.onAddorUpdate.emit()
                this.visible.set(false)
            } catch (e) {

            }
        })
    }

}