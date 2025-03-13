import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FileUploadComponent } from "../../shared/file-upload/file-upload.component";

export interface Option {
  label: string;
  value: string;
}

@Component({
  selector: 'app-estudios-drawer',
  imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, PersonalSearchComponent, CommonModule, FileUploadComponent],
  templateUrl: './estudios-drawer.component.html',
  styleUrl: './estudios-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstudiosDrawerComponent {
  ngForm = viewChild.required(NgForm);
  PersonalId = model<number>(0)
  visibleHistorial = model<boolean>(false)
  PersonalEstudioId = input.required<number>()
  selectedPeriod = input.required<any>()
  tituloDrawer = input.required<string>()
  openDrawerForConsult = input<boolean>(false)
  RefreshEstudio = model<boolean>(false)
  private apiService = inject(ApiService)
  formChange$ = new BehaviorSubject('');
  private notification = inject(NzNotificationService);
  PersonalIdForEdit = 0
  SucursalId = 0
  ArchivoIdForDelete = 0;
  files = model([]);
  isSaving = model<boolean>(false)
  nivelEstudioOptions: Option[] = [];
  estadoEstudioOptions: Option[] = [];



  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)
  
  uploading$ = new BehaviorSubject({loading:false,event:null});
  uploadFileModel = viewChild.required(NgForm);

  constructor(
    private searchService: SearchService
  ) { }

  async ngOnInit(): Promise<void> {
   //// this.nivelEstudioOptions = await firstValueFrom(this.apiService.getNivelEstudioOptions())
    ////this.estadoEstudioOptions = await firstValueFrom(this.apiService.getEstadoEstudioOptions())
  }

  cambios = computed(async () => {
    const visible = this.visible()
    this.ngForm().form.reset()
    if (visible) {
      const per = this.selectedPeriod()
      if (this.PersonalEstudioId() > 0) {
       // let vals = await firstValueFrom(this.apiService.getEstudio(per.year, per.month, this.PersonalId(), this.PersonalEstudioId()));
        //this.PersonalIdForEdit = vals.PersonalId
        //this.SucursalId = vals.SucursalId

       // this.ngForm().form.patchValue(vals)
        this.ngForm().form.markAsUntouched()
        this.ngForm().form.markAsPristine()

        if (this.openDrawerForConsult()) {
          this.ngForm().form.disable()
        } else {
          this.ngForm().form.enable()
        }
      }
    }
    return true
  })

  async save() {
    this.isSaving.set(true)
    try {
      const periodo = this.selectedPeriod()
      let vals = this.ngForm().value
      vals.anioRequest = periodo.year
      vals.mesRequest = periodo.month
      vals.Archivos = this.files
      vals.PersonalIdForEdit = this.PersonalIdForEdit
      //const res = await firstValueFrom(this.apiService.setEstudio(vals))

      this.ngForm().form.markAsUntouched()
      this.ngForm().form.markAsPristine()
      this.RefreshEstudio.set(true)
      this.formChange$.next("")
    } catch (error) {
      this.notification.error('Error', 'Error al guardar el estudio');
    }
    this.isSaving.set(false)
  }

  openDrawerforConsultHistory() {
    this.PersonalId.set(this.ngForm().value.PersonalId)
    this.visibleHistorial.set(true)
  }

  async confirmDeleteArchivo(id: string, tipoDocumentDelete: boolean) {
    try {
      this.ArchivoIdForDelete = parseInt(id);
      if (!tipoDocumentDelete) {
        //await firstValueFrom(this.apiService.deleteArchivosEstudios(this.ArchivoIdForDelete))
        this.notification.success('Respuesta', `Archivo borrado con éxito`);
      }
      this.formChange$.next('');
    } catch (error) {
      this.notification.error('Error', 'Error al borrar el archivo');
    }
  }
} 