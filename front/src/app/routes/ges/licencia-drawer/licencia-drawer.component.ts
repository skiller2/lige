import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, output, } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from '../../../shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from '../../../shared/inasistencia-search/inasistencia-search.component';
import { SituacionRevistaSearchComponent } from '../../../shared/situacionrevista-search/situacionrevista-search.component';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
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
  
  PersonalLicenciaId = input.required<number>()
  selectedPeriod = input.required<any>()
  tituloDrawer = input.required<string>()
  
  private apiService = inject(ApiService)
  formChange$ = new BehaviorSubject('');
  private notification = inject(NzNotificationService);
  openDrawerForConsult = input<boolean>(false)
  PersonalId = model<number>(0)
  visibleHistorial = model<boolean>(false)
  PersonalIdForEdit = 0
  SucursalId = 0
  ArchivoIdForDelete = 0;
  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)
  //selectedOption: string = "Indeterminado";
  options: any[] = [];
  files = model([]);
  //fileUploaded = false;
  onAddorUpdate = output()



  isSaving = model<boolean>(false)
  fileUploadComponent = viewChild.required(FileUploadComponent);


  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)

  uploading$ = new BehaviorSubject({ loading: false, event: null });
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
         
        vals.categoria = { id: `${vals.PersonalLicenciaTipoAsociadoId}-${vals.PersonalLicenciaCategoriaPersonalId}`, categoriaId: vals.PersonalLicenciaCategoriaPersonalId, tipoId: vals.PersonalLicenciaTipoAsociadoId }
        vals.PersonalLicenciaTipoAsociadoId = vals.categoria.categoriaId
        vals.PersonalLicenciaCategoriaPersonalId = vals.categoria.tipoId
        vals.PersonalLicenciaHorasMensuales = Number(vals.PersonalLicenciaHorasMensuales)
        this.PersonalIdForEdit = vals.PersonalId
        this.SucursalId = vals.SucursalId

        if (vals.PersonalLicenciaDiagnosticoMedicoDiagnostico != null)
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
      
      const documentoIds = res.data?.list[0]?.DocumentoId;
      const documentoIdsStr = Array.isArray(documentoIds) ? documentoIds.join(',') : ''

      vals.DocumentoId =  documentoIdsStr

      this.fileUploadComponent().LoadArchivosAnteriores(documentoIdsStr)
      this.ngForm().form.patchValue(vals)
      this.ngForm().form.markAsUntouched()
      this.ngForm().form.markAsPristine()
      //this.fileUploaded = false
      this.onAddorUpdate.emit()
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


  // Auditoría de la licencia (alta / última modificación), igual que en el drawer de descuentos de personal
  auditoria = signal<any>(null)

  auditoriaFilas = computed(() => {
    const a = this.auditoria()
    if (!a) return []
    return [
      { Evento: 'Alta', Usuario: a.AudUsuarioIng, Fecha: a.AudFechaIng, Ip: a.AudIpIng },
      { Evento: 'Última modificación', Usuario: a.AudUsuarioMod, Fecha: a.AudFechaMod, Ip: a.AudIpMod }
    ]
  })

  // Petición individual al hacer clic: el back valida el grupo gAuditoria
  async loadAuditoria() {
    this.auditoria.set(null)
    const PersonalId = this.PersonalIdForEdit || this.PersonalId()
    this.auditoria.set(await firstValueFrom(this.apiService.getLicenciaAuditoria(PersonalId, this.PersonalLicenciaId())))
  }

  openDrawerforConsultHistory() {
    this.PersonalId.set(this.ngForm().value.PersonalId)
    this.visibleHistorial.set(true)
  }

}