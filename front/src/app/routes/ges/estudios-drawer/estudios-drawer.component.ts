import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, signal, output, effect } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { PersonalSearchComponent } from '../../../shared/personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FileUploadComponent } from "../../../shared/file-upload/file-upload.component"
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

@Component({
    selector: 'app-estudios-drawer',
    imports: [SHARED_IMPORTS, 
      NzUploadModule, 
      NzAutocompleteModule,
      PersonalSearchComponent,
      CommonModule, 
      FileUploadComponent],
    templateUrl: './estudios-drawer.component.html',
    styleUrl: './estudios-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class EstudiosDrawerComponent {
  ArchivosEstudioAdd: any[] = [];
  tituloDrawer = signal<string>("Nuevo Estudio")
  disabled = input<boolean>(false)
  RefreshEstudio = model<boolean>(false)
  private apiService = inject(ApiService)
  private notification = inject(NzNotificationService)
  PersonalId = input.required<number>()
  PersonalEstudioId = input.required<number>() 
  PersonalIdForEdit = signal(0)
  ArchivoIdForDelete = 0;
  files = model([]);
  currentDate = new Date()
  anio = signal(this.currentDate.getFullYear())
  mes = signal(this.currentDate.getMonth() + 1)
  isSaving = model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  onRefreshEstudio = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  $optionsNivelEstudio = this.searchService.getEstudioSearch() 
  $optionsCurso = this.searchService.getCursoSearch() 

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    PersonalEstudioId: 0,
    PersonalId: 0,
    TipoEstudioId: 0,
    PersonalEstudioTitulo: "",
    CursoHabilitacionId: 0,
    PersonalEstudioOtorgado: "",
    PersonalIdForEdit: 0,
    files: [],
    PersonalEstudioPagina1Id: 0
  })

  constructor(private searchService: SearchService) { 
    effect(async() => { 
      const visible = this.visible()
      this.ArchivosEstudioAdd = []
      if (visible) {
        if (this.PersonalEstudioId() > 0) {
          let vals = await firstValueFrom(this.apiService.getEstudio(this.PersonalId(), this.PersonalEstudioId()));
          this.PersonalIdForEdit.set(vals.PersonalId)
          vals.personalEstudioId = vals.PersonalEstudioId
          vals.PersonalId = vals.PersonalId
          vals.TipoEstudioId = vals.TipoEstudioId
          vals.PersonalEstudioTitulo = vals.PersonalEstudioTitulo
          vals.CursoHabilitacionId = vals.PersonalEstudioCursoId
          vals.PersonalEstudioOtorgado = vals.PersonalEstudioOtorgado
          vals.PersonalEstudioPagina1Id = vals.PersonalEstudioPagina1Id

          this.formCli.patchValue(vals)
          this.formCli.markAsUntouched()
          this.formCli.markAsPristine()
  
          if (this.disabled()) {
            this.tituloDrawer.set(' Consultar Estudio ')
            this.formCli.disable()
          } else {
            this.tituloDrawer.set('Editar Estudio')
            this.formCli.enable()
          }
        }
      } else {
        this.formCli.reset()
        this.formCli.enable()
        this.PersonalIdForEdit.set(0)
        this.tituloDrawer.set(' Nuevo Estudio ')
      }
    })
  }

  async save() {
    this.isSaving.set(true)
    let vals = this.formCli.value
    try {
      vals.PersonalIdForEdit = this.PersonalIdForEdit()
      const res = await firstValueFrom(this.apiService.setEstudio(vals))
      if(res.data?.list?.PersonalId > 0) {
        
        this.PersonalIdForEdit.set(res.data?.list?.PersonalId)
        this.formCli.patchValue({
          PersonalEstudioId: res.data?.list?.PersonalEstudioId,
          PersonalEstudioPagina1Id: res.data?.list?.PersonalEstudioPagina1Id
        })
        this.tituloDrawer.set('Editar Estudio')
      }  

      this.onRefreshEstudio.emit()
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
    } catch (error) {
      // Handle error if needed
    }
    this.isSaving.set(false)
  }

  async deleteEstudio() {
    let vals = this.formCli.value
    //borra el estudio
    await firstValueFrom(this.apiService.deleteEstudio(vals))
    
    this.visible.set(false)
    this.onRefreshEstudio.emit()
  }
}