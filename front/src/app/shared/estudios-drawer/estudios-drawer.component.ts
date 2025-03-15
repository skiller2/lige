import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NgForm } from '@angular/forms';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime, switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { PersonalSearchComponent } from '../personal-search/personal-search.component'
import { EstudioSearchComponent } from '../estudio-search/estudio-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FileUploadComponent } from "../../shared/file-upload/file-upload.component";
import { CursoSearchComponent } from '../curso-search/curso-search.component';


export interface Option {
  label: string;
  value: string;
}

@Component({
  selector: 'app-estudios-drawer',
  imports: [SHARED_IMPORTS, NzUploadModule, NzDescriptionsModule, ReactiveFormsModule, PersonalSearchComponent, CommonModule, FileUploadComponent, EstudioSearchComponent, CursoSearchComponent],
  templateUrl: './estudios-drawer.component.html',
  styleUrl: './estudios-drawer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstudiosDrawerComponent {
  ngForm = viewChild.required(NgForm);
  PersonalId = model<number>(0)
  EstudioId = model<number>(0)
  visibleHistorial = model<boolean>(false)
  PersonalEstudioId = input.required<number>() 
  tituloDrawer = input.required<string>()
  openDrawerForConsult = input<boolean>(false)
  RefreshEstudio = model<boolean>(false)
  private apiService = inject(ApiService)
  formChange$ = new BehaviorSubject('');
  private notification = inject(NzNotificationService);
  PersonalIdForEdit = 0
  SucursalId = 0
  ArchivoIdForDelete = 0;
  ArchivosLicenciasAdd: any[] = [];
  files = model([]);
  isSaving = model<boolean>(false)
  nivelEstudioOptions: Option[] = [];
  estadoEstudioOptions: Option[] = [];
  currentDate = new Date()
  anio = signal(this.currentDate.getFullYear())
  mes = signal(this.currentDate.getMonth() + 1)


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
      this.ArchivosLicenciasAdd = []
      if (visible) {
        if (this.PersonalEstudioId() > 0) {
          let vals = await firstValueFrom(this.apiService.getEstudio(this.PersonalId(), this.PersonalEstudioId()));
          console.log("vals ", vals)
  
          //this.ngForm().form.patchValue(vals)
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
  
      let vals = this.ngForm().value
      vals.Archivos = this.files
      vals.PersonalIdForEdit = this.PersonalIdForEdit
      const res:any = await firstValueFrom(this.apiService.setEstudio(vals))

      this.ngForm().form.markAsUntouched()
      this.ngForm().form.markAsPristine()
      this.RefreshEstudio.set(true)
      this.formChange$.next("")
    } catch (error) {
      //this.notification.error('Error', 'Error al guardar el estudio');
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
        await firstValueFrom(this.apiService.deleteArchivosEstudios(this.ArchivoIdForDelete))
        this.notification.success('Respuesta', `Archivo borrado con éxito`);
      }
      this.formChange$.next('');
    } catch (error) {
      this.notification.error('Error', 'Error al borrar el archivo');
    }
  }
} 