import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, EventEmitter, output,  } from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormBuilder, FormControl, NgForm } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EstudioSearchComponent } from '../estudio-search/estudio-search.component';
import { CursoSearchComponent } from '../curso-search/curso-search.component';
import { PersonalSearchComponent } from '../personal-search/personal-search.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import  { FileUploadComponent } from "../../shared/file-upload/file-upload.component"
import { log } from '@delon/util';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';


export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-estudios-drawer',
    imports: [SHARED_IMPORTS, 
      NzUploadModule, 
      NzAutocompleteModule,
      EstudioSearchComponent,
      CursoSearchComponent, 
      PersonalSearchComponent,
      CommonModule, 
      FileUploadComponent],
    templateUrl: './estudios-drawer.component.html',
    styleUrl: './estudios-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class EstudiosDrawerComponent {
  //ngForm = viewChild.required(NgForm);
  //visibleHistorial = model<boolean>(false)

  //selectedPeriod = input.required<any>()
  ArchivosEstudioAdd: any[] = [];
  tituloDrawer = signal<string>("Nuevo Estudio")
  disabled =  input<boolean>(false)
  RefreshEstudio =  model<boolean>(false)
  private apiService = inject(ApiService)
  //formChange$ = new BehaviorSubject('');
  private notification = inject(NzNotificationService)

  PersonalId = input.required<number>()
  PersonalEstudioId = input.required<number>() 
  PersonalIdForEdit = signal(0)

  ArchivoIdForDelete = 0;
  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)
  //selectedOption: string = "Indeterminado";
  options: any[] = [];
  files = model([]);
  //fileUploaded = false;
 
  currentDate = new Date()
  anio = signal(this.currentDate.getFullYear())
  mes = signal(this.currentDate.getMonth() + 1)
  
  isSaving= model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)

  //@Output() OnRefreshEstudio = new EventEmitter();
  onRefreshEstudio = output<void>();


  uploading$ = new BehaviorSubject({loading:false,event:null});
  //uploadFileModel = viewChild.required(NgForm);


  fb = inject(FormBuilder)
  formCli = this.fb.group({
    personalEstudioId: 0,
    PersonalId: 0,
    TipoEstudioId: 0,
    PersonalEstudioTitulo: "",
    CursoHabilitacionId: 0,
    PersonalEstudioOtorgado: "",
    PersonalIdForEdit: 0,
    files: []
  })

  constructor(
    private searchService: SearchService
  ) { }

  async ngOnInit(): Promise<void> {

    this.ArchivosEstudioAdd = []
    this.PersonalIdForEdit.set(0)

    
  }

  cambios = computed(async () => {
    const visible = this.visible()
    //this.ngForm().form.reset()
    this.ArchivosEstudioAdd = []
    if (visible) {
      //const per = this.selectedPeriod()
      if (this.PersonalEstudioId() > 0) {
        let vals = await firstValueFrom(this.apiService.getEstudio(this.PersonalId(), this.PersonalEstudioId()));

        this.PersonalIdForEdit.set(vals.PersonalId)
        vals.personalEstudioId = vals.PersonalEstudioId
        vals.PersonalId =  vals.PersonalId,
        vals.TipoEstudioId = vals.TipoEstudioId,
        vals.PersonalEstudioTitulo = vals.PersonalEstudioTitulo,
        vals.CursoHabilitacionId = vals.PersonalEstudioCursoId,
        vals.PersonalEstudioOtorgado = vals.PersonalEstudioOtorgado
     
        this.formCli.patchValue(vals)
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()

        if (this.disabled()) {
          this.tituloDrawer.set(' Consultar Estudio ');
          this.formCli.disable()
        } else {
          this.tituloDrawer.set('Editar Estudio');
          this.formCli.enable()

        }
      }
    }
    return true
  })

  async save() {

    this.isSaving.set(true)
    let vals = this.formCli.value
    try {

      vals.PersonalIdForEdit = this.PersonalIdForEdit()

      const res =  await firstValueFrom(this.apiService.setEstudio(vals))
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
      //this.fileUploaded = false
      this.onRefreshEstudio.emit()
      //this.formCli$.next("")
    } catch (error) {

    }
    this.isSaving.set(false)
  }

  async deleteEstudio() {
     let vals = this.formCli.value
    let res = await firstValueFrom(this.apiService.deleteEstudio(vals))
    this.visible.set(false)
    this.onRefreshEstudio.emit()
  }

 async confirmDeleteArchivo( id: string, tipoDocumentDelete : boolean) {
    try {
      this.ArchivoIdForDelete = parseInt(id);
      if( tipoDocumentDelete){
        console.log("fieldname ", this.ArchivosEstudioAdd)
        console.log("ArchivoIdForDelete ", this.ArchivoIdForDelete)
        const ArchivoFilter = this.ArchivosEstudioAdd.filter((item) => item.fieldname === this.ArchivoIdForDelete)
        this.ArchivosEstudioAdd = ArchivoFilter
         
       this.notification.success('Respuesta', `Archivo borrado con exito `);

      }else{
        await firstValueFrom( this.apiService.deleteArchivosLicencias(this.ArchivoIdForDelete))
      }

      //this.formChange$.next('');
    } catch (error) {
      
    }
  }
  
}