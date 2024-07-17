import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorCategoriaComponent } from 'src/app/shared/editor-categoria/editor-categoria.component';
import { InasistenciaSearchComponent } from 'src/app/shared/inasistencia-search/inasistencia-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';


@Component({
  selector: 'app-licencia-drawer',
  standalone: true,
  imports: [SHARED_IMPORTS,NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, EditorCategoriaComponent, InasistenciaSearchComponent, PersonalSearchComponent, CommonModule],
  templateUrl: './licencia-drawer.component.html',
  styleUrl: './licencia-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LicenciaDrawerComponent {
  ngForm = viewChild.required(NgForm);
  PersonalId = input.required<number>()
  PersonalLicenciaId = input.required<number>()
  selectedPeriod = input.required<any>()
  ArchivosLicenciasAdd: any[] = [];
  tituloDrawer = input.required<string>()
  openDrawerForConsult =  model<boolean>(false)
  RefreshLicencia =  model<boolean>(false)
  private apiService = inject(ApiService)
  formChange$ = new BehaviorSubject('');
  PersonalIdForEdit = 0
  SucursalId = 0
  isSaving= model<boolean>(false)
  $ArchivosLicencias = this.formChange$.pipe(
    debounceTime(500),
    switchMap(() => {
      const periodo = this.selectedPeriod()
      return this.apiService
        .getLicenciasArchivosAnteriores(
          periodo.year, periodo.month, this.PersonalId(), this.PersonalLicenciaId()
        )
    })
  )
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  
  uploading$ = new BehaviorSubject({loading:false,event:null});
  constructor(
    private searchService: SearchService
  ) { }



  cambios = computed(async () => {
    const visible = this.visible()
    this.ngForm().form.reset()
    if (visible) {
      const per = this.selectedPeriod()
      if (this.PersonalLicenciaId() > 0) {
        let vals = await firstValueFrom(this.apiService.getLicencia(per.year, per.month, this.PersonalId(), this.PersonalLicenciaId()));
        vals.categoria = { id: `${vals.PersonalLicenciaTipoAsociadoId}-${vals.PersonalLicenciaCategoriaPersonalId}`,categoriaId:vals.PersonalLicenciaCategoriaPersonalId,tipoId:vals.PersonalLicenciaTipoAsociadoId }
        vals.PersonalLicenciaTipoAsociadoId = vals.categoria.categoriaId
        vals.PersonalLicenciaCategoriaPersonalId = vals.categoria.tipoId

        vals.PersonalLicenciaHorasMensuales = Number(vals.PersonalLicenciaHorasMensuales)
        this.PersonalIdForEdit = vals.PersonalId
        this.SucursalId = vals.SucursalId

        if(vals.PersonalLicenciaDiagnosticoMedicoDiagnostico != null)
          vals.PersonalLicenciaDiagnosticoMedicoDiagnostico = vals.PersonalLicenciaDiagnosticoMedicoDiagnostico.trim()

        console.log( "vals ", vals )
        this.ngForm().form.patchValue(vals)
        this.ngForm().form.markAsUntouched()
        this.ngForm().form.markAsPristine()
      }
    }
    return true
  })

  async save() {

    this.isSaving.set(true)
    try {
      const periodo = this.selectedPeriod()

      let vals = this.ngForm().value
      vals.PersonalLicenciaTipoAsociadoId = vals.categoria.categoriaId
      vals.PersonalLicenciaCategoriaPersonalId = vals.categoria.tipoId
      vals.anioRequest = periodo.year
      vals.mesRequest = periodo.month
      vals.Archivos = this.ArchivosLicenciasAdd
      vals.PersonalIdForEdit = this.PersonalIdForEdit
      const res = await firstValueFrom(this.apiService.setLicencia(vals))

      this.ngForm().form.markAsUntouched()
      this.ngForm().form.markAsPristine()
  
      this.ArchivosLicenciasAdd = []
      this.RefreshLicencia.set(true)

    } catch (error) {

    }
    this.isSaving.set(false)
  }

  async deletelicencia() {
    let vals = this.ngForm().value
    let res = await firstValueFrom(this.apiService.deleteLicencia(vals))
    this.visible.set(false)
  }

  uploadChange(event: any) {
    switch (event.type) {
      case 'start':
        
        this.uploading$.next({ loading: true, event })
    
        break;
      case 'progress':
        debugger
        break;
      case 'error':
        const Error = event.file.error
        if (Error.error.data?.list) {
        }
        this.uploading$.next({ loading:false,event })
        break;
      case 'success':
        const Response = event.file.response
       
        this.ArchivosLicenciasAdd = [ ...this.ArchivosLicenciasAdd, Response.data[0] ]
        console.log(this.ArchivosLicenciasAdd)
        this.uploading$.next({ loading: false, event })
        this.apiService.response(Response)  
        break
      default:
        break;
    }

  }
}