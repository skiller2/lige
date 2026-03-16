import { Component, inject, signal, model, computed, ViewEncapsulation, input, effect, resource } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, GridOption, SlickGrid } from 'angular-slickgrid';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { CommonModule } from '@angular/common';
import { ApiService, doOnSubscribe } from 'src/app/services/api.service';
import { SearchService } from 'src/app/services/search.service';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SettingsService, _HttpClient } from '@delon/theme';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NgForm, FormArray, FormBuilder } from '@angular/forms';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component";
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { ImageLoaderComponent } from '../../../shared/image-loader/image-loader.component';
import { applyEach, disabled, form, FormField, required, submit, validateTree } from '@angular/forms/signals';

export interface ExencionForm {
    DocumentoId: number,
    PersonalId: number,
    DocumentoTipoCodigo: string,
    DocumentoDenominadorDocumento: string,
    archivo: [],
    PersonalExencionId: number,
    PersonalExencionDesde: string,
    PersonalExencionHasta: string
}

@Component({
    selector: 'app-personal-exenciones-drawer',
    templateUrl: './personal-exenciones-drawer.html',
    styleUrl: './personal-exenciones-drawer.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, FileUploadComponent,
        NgxExtendedPdfViewerModule, ImageLoaderComponent, FormField],
    providers: [AngularUtilService]
})

export class PersonalExencionesDrawerComponent {

    placement: NzDrawerPlacement = 'left';

    PersonalId = input<number>(0)
    PersonalNombre = signal<string>("")
    isLoading = signal<boolean>(false);
    optionsLabels = signal<any[]>([]);
    label = signal<string>('. . .');
    fileName = signal<string>('')
    tableName = signal<string>('')
    exencionesHistory = signal<any[]>([]);
    now = signal<Date>(new Date())
    modalViewerVisiable1 = signal<boolean>(false)
    modalViewerVisiable2 = signal<boolean>(false)

    visibleDocumentos = model<boolean>(false)

    public src = signal<Blob>(new Blob())
    public srcImg = signal<string>('')

    private destroy$ = new Subject();
    private readonly tokenService = inject(DA_SERVICE_TOKEN);

    private readonly defaultFormExencion: ExencionForm = {
        DocumentoId: 0,
        PersonalId: 0,
        DocumentoTipoCodigo: '',
        DocumentoDenominadorDocumento: '',
        archivo: [],
        PersonalExencionId: 0,
        PersonalExencionDesde: '',
        PersonalExencionHasta: ''
    }

    readonly parametroExencion = signal<ExencionForm>({ ...this.defaultFormExencion });

    readonly formParametroExencion = form(this.parametroExencion, (p) => {
        required(p.PersonalExencionDesde, { 
            message: 'Desde es requerido',
            when: (ctx) => ctx.valueOf(p.PersonalExencionId) !== 0,
        });

        // disabled(p.archivo, (ctx) => (ctx.valueOf(p.DocumentoTipoCodigo) === '' || ctx.valueOf(p.DocumentoTipoCodigo) === null));
    });

    private searchService = inject(SearchService)
    private apiService = inject(ApiService)

    effectExencionForm = effect(async () => {
        const visible = this.visibleDocumentos()
        const newId: number = this.PersonalId()
        if (visible && newId > 0) {
            // this.resetForm()
            let obj: any = { PersonalId: this.PersonalId() }
            const exencion: any[] = await firstValueFrom(this.searchService.getExencionesByPersonalId(this.PersonalId()))
            
            if (exencion.length) {

                exencion.map((exe:any) =>{
                    const PersonalExencionDesde = new Date(exe.PersonalExencionDesde)
                    const PersonalExencionHasta = exe.PersonalExencionHasta ? new Date(exe.PersonalExencionHasta) : null
                    if (PersonalExencionDesde.getTime() <= this.now().getTime()) {
                        obj = {
                            ...obj,
                            PersonalExencionId: exencion[0].PersonalExencionId,
                            PersonalExencionDesde: exencion[0].PersonalExencionDesde,
                            PersonalExencionHasta: exencion[0].PersonalExencionHasta
                        }
                    }
                    exe.PersonalExencionDesde = `${PersonalExencionDesde.getDate()}/${PersonalExencionDesde.getMonth()+1}/${PersonalExencionDesde.getFullYear()}`
                    exe.PersonalExencionHasta = PersonalExencionHasta? `${PersonalExencionHasta.getDate()}/${PersonalExencionHasta.getMonth()+1}/${PersonalExencionHasta.getFullYear()}` : PersonalExencionHasta
                })
                
            }
            this.exencionesHistory.set(exencion)
            
            this.parametroExencion.update((m) => ({
                ...m,
                ...obj
            }))
            this.formParametroExencion().reset()
        }
        // this.parametroExencion().markAsDirty();
    });

    listaExcencionPer = resource({
        params: () => ({ PersonalId: this.PersonalId() }),
        loader: async () => {
            const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
            this.PersonalNombre.set(personal.PersonalApellido + ', ' + personal.PersonalNombre)
            const res = await firstValueFrom(this.searchService.getExencionesDocsByPersonal(Number(this.PersonalId())))
            return res
        },
        defaultValue: []
    });

    async ngOnInit() {
        const options: any = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
        //Aca filtra los tipos de documentos
        const opcionsPersonal = options.filter((obj: any) => obj.value.includes("FOR1"))
        this.optionsLabels.set(opcionsPersonal)
    }

    ngOnDestroy(): void {
        this.destroy$.next('');
        this.destroy$.complete();
    }

    selectLabel(val: any) {
        const tipoDoc = val
        const find = this.optionsLabels().find((obj: any) => { return tipoDoc == obj.value })
        if (find && find.des_den_documento) {
            this.label.set(`${find.des_den_documento}`)
        } else if (find) {
            this.label.set(`Denominacion de ${find.label}`)
        } else
            this.label.set('. . .')
    }

    async save() {
        await submit(this.formParametroExencion, async (form) => {
            const values: any = form().value()
            try {
                let res: any = null
                if (values.PersonalExencionId) {
                    res = await firstValueFrom(this.apiService.updateExencion(values))

                } else {
                    res = await firstValueFrom(this.apiService.addExencion(values))
                    if (res.data.DocumentoId) {
                        this.parametroExencion.update((m) => ({
                            ...m,
                            PersonalExencionId: res.data.PersonalExencionId,
                        }))
                    }
                }

                if (!this.parametroExencion().DocumentoId && res.data.DocumentoId) {
                    this.parametroExencion.update((m) => ({
                        ...m,
                        DocumentoId: res.data.DocumentoId
                    }))
                }


                this.listaExcencionPer.reload()
                // this.parametroExencion().markAsUntouched()
                // this.parametroExencion().markAsPristine()
                this.formParametroExencion().reset()
            } catch (e: any) {
                return this.apiService.formBackendErrors(form, e.error?.data?.fieldErrors);
            }
            return undefined
        })
    }

    resetForm() {
        this.parametroExencion.update((m) => ({
            ...m,
            DocumentoId: 0,
            DocumentoTipoCodigo: '',
            archivo: [],
        }))
        this.formParametroExencion().reset()
    }

    async LoadArchivo(url: string, filename: string) {
        this.modalViewerVisiable1.set(false)
        this.src.set(await fetch(`${url}`, { headers: { token: this.tokenService.get()?.token ?? '' } }).then(res => res.blob()))
        this.fileName.set(filename)
        this.modalViewerVisiable1.set(true)
    }

    async LoadImage(url: string, filename: string) {
        this.modalViewerVisiable2.set(false)
        this.srcImg.set(url)
        this.fileName.set(filename)
        this.modalViewerVisiable2.set(true)
    }

    handleCancel(): void {
        this.modalViewerVisiable1.set(false)
        this.modalViewerVisiable2.set(false)
    }
}