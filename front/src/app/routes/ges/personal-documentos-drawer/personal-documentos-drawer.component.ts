import { Component, inject, signal, model, computed, ViewEncapsulation, input, effect } from '@angular/core';
import { BehaviorSubject, debounceTime, map, switchMap, tap, Subject, firstValueFrom } from 'rxjs';
import { AngularGridInstance, AngularUtilService, Column, FileType, GridOption, SlickGrid } from 'angular-slickgrid';
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

@Component({
    selector: 'app-personal-documentos-drawer',
    templateUrl: './personal-documentos-drawer.component.html',
    styleUrl: './personal-documentos-drawer.component.less',
    imports: [...SHARED_IMPORTS, CommonModule, NzAffixModule, FileUploadComponent,
        NgxExtendedPdfViewerModule, ImageLoaderComponent],
    providers: [AngularUtilService]
})
  
export class PersonalDocumentosDrawerComponent {
    PersonalId = input(0)
    PersonalNombre = signal<string>("")
    isLoading = signal(false);
    visibleDocumentos = model<boolean>(false)
    placement: NzDrawerPlacement = 'left';
    optionsLabels = signal<any[]>([]);
    label = signal<string>('. . .');
    modalViewerVisiable1 = signal<boolean>(false)
    modalViewerVisiable2 = signal<boolean>(false)
    fileName = signal<string>('')
    tableName = signal<string>('')
    public src = signal<Blob>(new Blob())
    public srcImg = signal<string>('')

    constructor(
        private searchService: SearchService,
        private apiService: ApiService,
    ) {
        effect(async () => {
            const newId:number = this.PersonalId()
            if (newId > 0) {
                this.formDocumento.reset()
                this.formDocumento.get('persona_id')?.setValue(newId)
            }
        });
    }
    private destroy$ = new Subject();
    private readonly tokenService = inject(DA_SERVICE_TOKEN);

    fb = inject(FormBuilder)
    formDocumento = this.fb.group({ 
        doc_id:0, persona_id:0, doctipo_id: '', den_documento: null, fecha: null, fec_doc_ven: null, archivo: [] 
    })

    doc_id(): number {
        const value = this.formDocumento.get("doc_id")?.value
        if (value)
            return value
        return 0
    }
    doctipo_id(): string {
        const value = this.formDocumento.get("doctipo_id")?.value
        if (value)
            return value
        return ''
    }

    selectedPersonalIdChange$ = new BehaviorSubject('');
    $listaDocumentosPer = this.selectedPersonalIdChange$.pipe(
        debounceTime(500),
        switchMap(() =>{
            setTimeout(async () => {
                const personal = await firstValueFrom(this.searchService.getPersonalById(this.PersonalId()))
                this.formDocumento.patchValue({den_documento: personal.PersonalCUITCUILCUIT})
                this.PersonalNombre.set(personal.PersonalApellido+', '+personal.PersonalNombre)
            }, 0);
            return this.searchService.getDocumentosByPersonal(Number(this.PersonalId()))
        })
    );

    async ngOnInit(){
        this.selectedPersonalIdChange$.next('');
        const options:any = await firstValueFrom(this.searchService.getDocumentoTipoOptions())
        //aca filtra los tipos de documentos que no son de personal
        //const opcionsPersonal = options.filter((obj:any) => obj.des_den_documento.includes("Personal"))
        this.optionsLabels.set(options)
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
        const values = this.formDocumento.value
        try {
            if (values.doc_id){
                await firstValueFrom(this.apiService.updateDocumento(values))
            } else {
                const res = await firstValueFrom(this.apiService.addDocumento(values))
                if (res.data.doc_id){
                    this.formDocumento.patchValue({ doc_id: res.data.doc_id })
                }
            }
            this.selectedPersonalIdChange$.next('');
            this.formDocumento.markAsUntouched()
            this.formDocumento.markAsPristine()
        } catch (e) {

        }

        this.isLoading.set(false)
    }

    resetForm() {
        this.formDocumento.reset({persona_id: this.PersonalId()})
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