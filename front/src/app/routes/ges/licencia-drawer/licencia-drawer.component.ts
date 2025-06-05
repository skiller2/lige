import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { SituacionRevistaSearchComponent } from 'src/app/shared/situacionrevista-search/situacionrevista-search.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import  { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { log } from '@delon/util';

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-licencia-drawer',
    imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, EditorCategoriaComponent, InasistenciaSearchComponent, PersonalSearchComponent, CommonModule, FileUploadComponent, SituacionRevistaSearchComponent],
    templateUrl: './licencia-drawer.component.html',
    styleUrl: './licencia-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class LicenciaDrawerComponent {
  ngForm = viewChild.required(NgForm);
  PersonalId = model<number>(0)
  visibleHistorial = model<boolean>(false)
  PersonalLicenciaId = input.required<number>()
  selectedPeriod = input.required<any>()
  tituloDrawer = input.required<string>()
  openDrawerForConsult =  input<boolean>(false)
  RefreshLicencia =  model<boolean>(false)
  private apiService = inject(ApiService)
  formChange$ = new BehaviorSubject('');
  private notification = inject(NzNotificationService);
  PersonalIdForEdit = 0
  SucursalId = 0
  ArchivoIdForDelete = 0;
  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)
  //selectedOption: string = "Indeterminado";
  options: any[] = [];
  files = model([]);
  //fileUploaded = false;
 

  
  isSaving= model<boolean>(false)
  fileUploadComponent = viewChild.required(FileUploadComponent);


  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  
  uploading$ = new BehaviorSubject({loading:false,event:null});
  uploadFileModel = viewChild.required(NgForm);
  constructor(
    private searchService: SearchService
  ) { }

  async ngOnInit(): Promise<void> {


    this.options = await firstValueFrom(this.apiService.getOptionsForLicenciaDrawer())
  }

  cambios = computed(async () => {
    const visible = this.visible()
    this.ngForm().form.reset()

    if (visible) {
      const per = this.selectedPeriod()
      if (this.PersonalLicenciaId() > 0) {
        let vals = await firstValueFrom(this.apiService.getLicencia(per.year, per.month, this.PersonalId(), this.PersonalLicenciaId()));
        console.log("vals ", vals)
        vals.categoria = { id: `${vals.PersonalLicenciaTipoAsociadoId}-${vals.PersonalLicenciaCategoriaPersonalId}`,categoriaId:vals.PersonalLicenciaCategoriaPersonalId,tipoId:vals.PersonalLicenciaTipoAsociadoId }
        vals.PersonalLicenciaTipoAsociadoId = vals.categoria.categoriaId
        vals.PersonalLicenciaCategoriaPersonalId = vals.categoria.tipoId
        vals.PersonalLicenciaHorasMensuales = Number(vals.PersonalLicenciaHorasMensuales)
        this.PersonalIdForEdit = vals.PersonalId
        this.SucursalId = vals.SucursalId

        if(vals.PersonalLicenciaDiagnosticoMedicoDiagnostico != null)
          vals.PersonalLicenciaDiagnosticoMedicoDiagnostico = vals.PersonalLicenciaDiagnosticoMedicoDiagnostico.trim()

        this.PersonalLicenciaAplicaPeriodoHorasMensuales.set(vals.PersonalLicenciaAplicaPeriodoHorasMensuales)

        this.ngForm().form.patchValue(vals)

        this.ngForm().form.markAsUntouched()
        this.ngForm().form.markAsPristine()

        if (this.openDrawerForConsult()) {
          this.ngForm().form.disable()
        } else {
          this.ngForm().form.enable()

        }
    
        this.ngForm().form.get('PersonalLicenciaSituacionRevistaId')?.disable();
      }
    }
    return true
  })

  async save() {

    this.isSaving.set(true)
    let vals = this.ngForm().value
    try {
      const periodo = this.selectedPeriod()

      let vals = this.ngForm().value
      vals.PersonalLicenciaTipoAsociadoId = vals.categoria.categoriaId
      vals.PersonalLicenciaCategoriaPersonalId = vals.categoria.tipoId
      vals.anioRequest = periodo.year
      vals.mesRequest = periodo.month
      vals.Archivos = this.files
      vals.PersonalIdForEdit = this.PersonalIdForEdit
      vals.PersonalLicenciaAplicaPeriodoHorasMensuales = this.PersonalLicenciaAplicaPeriodoHorasMensuales()
      const res = await firstValueFrom(this.apiService.setLicencia(vals))
      this.fileUploadComponent().LoadArchivosAnteriores(res.data?.list[0]?.DocumentoId)
      this.ngForm().form.markAsUntouched()
      this.ngForm().form.markAsPristine()
      //this.fileUploaded = false
      this.RefreshLicencia.set(true)
      this.formChange$.next("")
    } catch (error) {

    }
    this.isSaving.set(false)
  }

  async deletelicencia() {
    let vals = this.ngForm().value
    //al implementar ve los 3 valores que necesita el back
    //let res = await firstValueFrom(this.apiService.deleteLicencia(vals))
    this.visible.set(false)
  }


  openDrawerforConsultHistory(){
    this.PersonalId.set(this.ngForm().value.PersonalId)
    this.visibleHistorial.set(true)
  }
  
}