import { Component, Injector, viewChild, inject, signal, model, computed, ViewEncapsulation, input, effect, output, untracked, resource } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom, Observable, forkJoin } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { FormBuilder } from '@angular/forms';
import { LoadingService } from '@delon/abc/loading';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ViewResponsableComponent } from "../../../shared/view-responsable/view-responsable.component";
import { applyEach, disabled, FieldTree, form, FormField, readonly, required, submit, type ValidationError } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';

export interface FormDesc {
    id: number;
    AplicaEl: Date | null;
    AplicaA: string;
    DescuentoId: number;
    ObjetivoId: number;
    Cuotas: number;
    Importe: string;
    Detalle: string;
    FechaAnulacion: Date | null;
    DetalleAnulacion: string;
    ImportacionDocumentoId: number | null;
    oldObjetivoId: number;
}

@Component({
    selector: 'app-descuentos-objetivos-alta-drawer',
    templateUrl: './descuentos-objetivos-alta-drawer.component.html',
    styleUrl: './descuentos-objetivos-alta-drawer.component.scss',
    encapsulation: ViewEncapsulation.None,
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule,
        ObjetivoSearchComponent, ViewResponsableComponent, FormField],
    providers: [AngularUtilService],
})
export class DescuentosObjetivosAltaDrawerComponent {
    isLoading = signal(false);
    visibleDesc = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    ObjetivoDescuentoId = model<number>(0);
    objetivoId = model<number>(0);
    disabled = input<boolean>(false);
    cancelDesc = input<boolean>(false);
    isAnulacion = input<boolean>(false);
    onAddorUpdate = output()

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)
    private readonly loadingSrv = inject(LoadingService);

    private descuentoObjetivoDefault: FormDesc = {
        id: 0,
        AplicaA: '', DescuentoId: 0, ObjetivoId: 0, AplicaEl: new Date(),
        Cuotas: 1, Importe: '', Detalle: '',
        DetalleAnulacion: '',
        FechaAnulacion: null,
        ImportacionDocumentoId: null,
        oldObjetivoId: 0
    }

    readonly descuentoObjetivo = signal<FormDesc>(this.descuentoObjetivoDefault);

    readonly formDescuentoObjetivo = form(this.descuentoObjetivo, (p) => {
        disabled(p, () => this.disabled())
        readonly(p.DetalleAnulacion, () => (this.disabled() && !this.isAnulacion()))
        disabled(p.FechaAnulacion, () => true)
        disabled(p.ImportacionDocumentoId, () => true)
    })

    loadEffect = effect(async () => {
        if (!this.visibleDesc()) return;

        const ObjetivoDescuentoId = this.ObjetivoDescuentoId();
        const objetivoId = this.objetivoId();

        if (ObjetivoDescuentoId && objetivoId) {
            void this.loadDescuentoObjetivo();
        }else {
            untracked(() => queueMicrotask(() => this.resetForm()));
        }
    });

    importeCuota = computed(() => {
        const s = this.descuentoObjetivo();
        const importe = Number(s.Importe) || 0;
        const cuotas = Number(s.Cuotas) || 1;      // evita /0
        const total = importe / cuotas;
        return total.toFixed(2); // string
    });

    async loadDescuentoObjetivo() {
        const infoDesc = await firstValueFrom(this.searchService.getDescuentoObjetivo(this.objetivoId(), this.ObjetivoDescuentoId()))
        // console.log('infoDesc: ', infoDesc);
        
        infoDesc.oldObjetivoId = infoDesc.ObjetivoId
        infoDesc.AplicaEl = infoDesc.AplicaEl? new Date(infoDesc.AplicaEl) : null
        infoDesc.FechaAnulacion = infoDesc.FechaAnulacion? new Date(infoDesc.FechaAnulacion) : null
        // infoDesc.Importe = infoDesc.Importe.toString()
        // console.log('infoDesc: ', infoDesc);
        
        this.descuentoObjetivo.set(infoDesc)
        
        setTimeout(() => {
            this.formDescuentoObjetivo().reset()
        }, 500)
    }

    // private destroy$ = new Subject();

    // selectedObjetivoIdChange$ = new BehaviorSubject(0);
    // objetivoResponsablesLoading$ = new BehaviorSubject<boolean | null>(null);

    optionsAplicaA = toSignal(this.searchService.getDecuentosAplicaAOptions(), { initialValue: [] });
    optionsTipo = toSignal(this.searchService.getDecuentosTipoOptions(), { initialValue: [] });
    objetivoDetalle = resource({
        params: () => ({ ObjetivoId: this.inputObjetivoId(), anio: this.anio(), mes: this.mes() }),
        loader: async ({ params }) => {

            if (params.ObjetivoId && params.anio && params.mes) {
                return await firstValueFrom(this.getObjetivoDetalle(params.ObjetivoId, params.anio, params.mes))
            }
        }
    })

    anio = computed(() => {
        const value = this.descuentoObjetivo().AplicaEl
        return value ? new Date(value).getFullYear() : 0
    });

    mes = computed(() => {
        const value = this.descuentoObjetivo().AplicaEl
        return value ? new Date(value).getMonth() + 1 : 0
    });

    inputObjetivoId = computed(() => {
        return this.descuentoObjetivo().ObjetivoId
    });

    async ngOnInit() { }

    async save() {
        await submit(this.formDescuentoObjetivo, async (form) => {
            this.isLoading.set(true)
            let values = form().value()
            try {
                if (values.id) {
                    await firstValueFrom(this.apiService.updateDescuento(values))
                } else {
                    const res = await firstValueFrom(this.apiService.addDescuento(values))
                    if (res.data.id)
                        this.descuentoObjetivo.update((state) => {
                            return { ...state, id: res.data.id, oldObjetivoId: values.ObjetivoId }
                        })
                }
                this.onAddorUpdate.emit()
                form().reset()
            } catch (e) {

            }
            this.isLoading.set(false)
        })
    }

    resetForm() {
        this.descuentoObjetivo.set(this.descuentoObjetivoDefault)

        this.formDescuentoObjetivo().reset()
    }

    getObjetivoDetalle(objetivoId: number, anio: number, mes: number): Observable<any> {
        // this.loadingSrv.open({ type: 'spin', text: '' })
        return forkJoin([
            this.searchService.getObjetivoResponsables(objetivoId, anio, mes),
            this.searchService.getObjetivoContratos(objetivoId, anio, mes),
            this.searchService.getAsistenciaPeriodo(objetivoId, anio, mes),
        ]).pipe(
            map((data: any[]) => {
                this.loadingSrv.close()
                return { responsable: data[0], contratos: data[1], periodo: data[2] };
            })
        );
    }

    async cancel() {
        this.isLoading.set(true)
        let values = this.descuentoObjetivo()
        try {
            if (this.ObjetivoDescuentoId() && this.objetivoId()) {
                await firstValueFrom(this.apiService.cancellationObjetivoDescuento(values))
                this.onAddorUpdate.emit()
            }
        } catch (e) { }
        this.isLoading.set(false)
    }

}