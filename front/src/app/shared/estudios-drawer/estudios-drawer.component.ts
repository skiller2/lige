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



  RefreshEstudio = model<boolean>(false)
  readonly = input<boolean>(false)
  tituloDrawer = input.required<string>()
  PersonalId = input.required<number>()
  PersonalEstudioId = input.required<number>() 


  EstudioId = model<number>(0)
  visibleHistorial = model<boolean>(false)
  PersonalIdForEdit = input<number>(0)

  ArchivoIdForDelete = signal<number>(0)
  ArchivosLicenciasAdd: any[] = [];
  files = model([]);
  isSaving = model<boolean>(false)


  currentDate = new Date()
  anio = signal(this.currentDate.getFullYear())
  mes = signal(this.currentDate.getMonth() + 1)
 
  visible = model<boolean>(false)
  uploadFileModel = viewChild.required(NgForm);
  ngForm = viewChild.required(NgForm);
  placement: NzDrawerPlacement = 'left';
  private apiService = inject(ApiService)
  private notification = inject(NzNotificationService);
  formChange$ = new BehaviorSubject('');
  //uploading$ = new BehaviorSubject({loading:false,event:null});

  constructor(
    private searchService: SearchService
  ) { }

  async ngOnInit(): Promise<void> {

  }
  

    cambios = computed(async () => {
     
      if (this.visible()) {
        if (this.PersonalEstudioId() > 0) {
          let vals = await firstValueFrom(this.apiService.getEstudio(this.PersonalId(), this.PersonalEstudioId()));
    
          console.log("vals ", vals)
         
    
          this.ngForm().form.patchValue({ 
            PersonalId: vals.PersonalId,
            TipoEstudioId:vals.TipoEstudioId,
            PersonalEstudioTitulo:vals.PersonalEstudioTitulo,
            CursoHabilitacionId:vals.PersonalEstudioCursoId,
            PersonalEstudioOtorgado:vals.PersonalEstudioOtorgado
          })

          console.log("ngForm().form ", this.ngForm().form.value)
          this.ngForm().form.markAsUntouched()
          this.ngForm().form.markAsPristine()
  
          if (this.readonly()) {
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


  async confirmDeleteArchivo(id: string, tipoDocumentDelete: boolean) {
    try {
      this.ArchivoIdForDelete.set(parseInt(id));
      if (!tipoDocumentDelete) {
        await firstValueFrom(this.apiService.deleteArchivosEstudios(this.ArchivoIdForDelete()))
        this.notification.success('Respuesta', `Archivo borrado con éxito`);
      }
      this.formChange$.next('');
    } catch (error) {
      this.notification.error('Error', 'Error al borrar el archivo');
    }
  }
} 