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
    Exencion: boolean,
    PersonalExencionDesde: string
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
        Exencion: false,
        PersonalExencionDesde: ''
    }

    readonly parametroExencion = signal<ExencionForm>({...this.defaultFormExencion});

    readonly formDocumento = form(this.parametroExencion);

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
    ) {
        effect(async () => {
            const visible = this.visibleDocumentos()
            const newId:number = this.PersonalId()
            if (visible && newId > 0) {
                this.resetForm()
                const exencion = await firstValueFrom(this.searchService.getLastExencionByPersonalId(this.PersonalId()))
                
                if (exencion && !exencion.PersonalExencionHasta) {
                    this.formDocumento
                    this.formDocumento.PersonalExencionId().value.set(exencion.PersonalExencionId)
                    this.formDocumento.Exencion().value.set(exencion.PersonalExencionId)
                    this.formDocumento.PersonalExencionDesde().value.set(exencion.PersonalExencionDesde)
                }
                
            }
            // this.formDocumento().markAsDirty();
        });
    }

    DocumentoId(): number {
        const value = this.formDocumento.DocumentoId().value()
        if (value)
            return value
        return 0
    }

    DocumentoTipoCodigo(): string {
        const value = this.formDocumento.DocumentoTipoCodigo().value()
        if (value)
            return value
        return ''
    }

    listaExcencionPer = resource({
        params: () => ({ PersonalId: this.PersonalId() }),
        loader: async () => {
            const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
            this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            const res = await firstValueFrom(this.searchService.getExencionesDocsByPersonal(Number(this.PersonalId())))
            return  res
        },
        defaultValue: []
    });

    async ngOnInit(){
        const options:any = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
        //aca filtra los tipos de documentos
        const opcionsPersonal = options.filter((obj:any) => obj.value.includes("FOR1"))
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
        this.isLoading.set(true)
        const values = this.formDocumento().value()
        try {
            if (values.PersonalExencionId){
                await firstValueFrom(this.apiService.updateExencion(values))
            } else {
                const res = await firstValueFrom(this.apiService.addExencion(values))
                if (res.data.DocumentoId){
                    this.formDocumento.DocumentoId().reset(res.data.DocumentoId)
                }
            }
            this.listaExcencionPer.reload()
            // this.formDocumento().markAsUntouched()
            // this.formDocumento().markAsPristine()
            
        } catch (e) {
        }
       
        this.isLoading.set(false)
    }

    resetForm() {
        this.formDocumento().value.set({...this.defaultFormExencion})
        this.formDocumento.PersonalId().value.set(this.PersonalId())
    }

    async LoadArchivo(url: string, filename: string) {
        this.modalViewerVisiable1.set(false)
        this.src.set(await fetch(`${url}`,{headers:{token:this.tokenService.get()?.token ?? ''}}).then(res => res.blob()))
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