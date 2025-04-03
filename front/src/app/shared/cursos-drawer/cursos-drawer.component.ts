import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, EventEmitter, output, effect,  } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';


type listOptionsT = {
  filtros: any[],
  extra: any,
  sort: any,
}

export interface Option {
  label: string;
  value: string;
}

@Component({
    selector: 'app-cursos-drawer',
    imports: [SHARED_IMPORTS, 
      NzUploadModule, 
      NzAutocompleteModule,
      CommonModule,
    ],
    templateUrl: './cursos-drawer.component.html',
    styleUrl: './cursos-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class CursosDrawerComponent {

  ArchivosEstudioAdd: any[] = [];
  tituloDrawer = signal<string>("Nuevo Curso")
  disabled =  input<boolean>(false)
  RefreshCurso =  model<boolean>(false)
  private apiService = inject(ApiService)

  private notification = inject(NzNotificationService)

  CursoHabilitacionSelectedId = input.required<number>()
  CursoHabilitacionIdForEdit = signal(0)
  
  CentroCapacitacionIdSelected = signal(0)
  CentroCapacitacionSedeIdSelected = signal(0)

  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)

  options: any[] = [];

  currentDate = new Date()
  anio = signal(this.currentDate.getFullYear())
  mes = signal(this.currentDate.getMonth() + 1)
  
  isSaving= model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)

  onRefreshCurso = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  $optionsCentroCapacitacion = this.searchService.getCentroCapacitacionSearch()
  $optionsCentroCapacitacionSede = this.searchService.getCentroCapacitacionSedeSearch()
  $optionsModalidadCurso = this.searchService.getModalidadCursoSearch()

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    CursoHabilitacionCodigo: "",
    CursoHabilitacionId: 0,
    CursoHabilitacionDescripcion:"",
    CursoHabilitacionCantidadHoras: 0,
    CursoHabilitacionVigencia: 0,
    ModalidadCursoCodigo: "",
    CursoHabilitacionInstructor: "",
    CentroCapacitacionId: 0,
    CentroCapacitacionSedeId: 0,
    CursoHabilitacionIdForEdit: 0
  })

  constructor(
    private searchService: SearchService
  ) { 
    effect(async() => {
      const visible = this.visible()
 
    if (visible) {
      if (this.CursoHabilitacionSelectedId() > 0) {
        let vals = await firstValueFrom(this.apiService.getListCursosHistory( { options: this.listOptions }, this.anio(), this.mes(), this.CursoHabilitacionSelectedId(),""))
       
          this.CursoHabilitacionIdForEdit.set(vals.list[0].CursoHabilitacionId)
          vals.CursoHabilitacionCodigo = vals.list[0].CursoHabilitacionCodigo,
          vals.CursoHabilitacionId = vals.list[0].CursoHabilitacionId,
          vals.CursoHabilitacionDescripcion = vals.list[0].CursoHabilitacionDescripcion,
          vals.CursoHabilitacionCantidadHoras = vals.list[0].CursoHabilitacionCantidadHoras,
          vals.CursoHabilitacionVigencia = Number(vals.list[0].CursoHabilitacionVigencia),
          vals.ModalidadCursoCodigo = vals.list[0].ModalidadCursoCodigo,
          vals.CursoHabilitacionInstructor = vals.list[0].CursoHabilitacionInstructor,
          vals.CentroCapacitacionId = vals.list[0].CentroCapacitacionId,
          vals.CentroCapacitacionSedeId = vals.list[0].CentroCapacitacionSedeId

          //console.log("vals",vals)
          
          this.formCli.patchValue(vals)
          this.formCli.markAsUntouched()
          this.formCli.markAsPristine()

          //this.CentroCapacitacionIdSelected.set(vals.list[0].CentroCapacitacionId)
          //this.CentroCapacitacionSedeIdSelected.set(vals.list[0].CentroCapacitacionSedeId)

        if (this.disabled()) {
          this.tituloDrawer.set(' Consultar Estudio ');
          this.formCli.disable()
        } else {
          this.tituloDrawer.set('Editar Estudio');
          this.formCli.enable()

        }
      }else{
        this.formCli.reset()
        this.formCli.enable()
        this.CursoHabilitacionIdForEdit.set(0);
      }
    }
    });
  }

  async ngOnInit(): Promise<void> {

    this.CursoHabilitacionIdForEdit.set(0)
    this.CentroCapacitacionIdSelected.set(0)
    this.CentroCapacitacionSedeIdSelected.set(0)
  }

 

  updateValues() {
    
    setTimeout(() => {

    this.CentroCapacitacionIdSelected.set(this.formCli.value.CentroCapacitacionId || 0)
    this.formCli.patchValue({CentroCapacitacionSedeId: 0})

    }, 1000)
  }

  async save() {

    this.isSaving.set(true)
    let vals = this.formCli.value
    try {

      vals.CursoHabilitacionIdForEdit = this.CursoHabilitacionSelectedId()

      const res =  await firstValueFrom(this.apiService.setCursos(vals))

    if(res.data?.list[0]?.CursoHabilitacionId > 0){
      this.CursoHabilitacionIdForEdit.set(res.data?.list[0]?.CursoHabilitacionId)
      this.formCli.patchValue({
          CursoHabilitacionId: res.data?.list[0]?.CursoHabilitacionId,
          CursoHabilitacionIdForEdit: res.data?.list[0]?.CursoHabilitacionId
        })

        this.tituloDrawer.set('Editar Estudio');

      }  
      
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
      this.onRefreshCurso.emit()
      //this.formCli$.next("")
    } catch (error) {

    }
    this.isSaving.set(false)
  }

  async deleteCurso() {
     let vals = this.formCli.value
     
    let res = await firstValueFrom(this.apiService.deleteCurso(vals))
    this.visible.set(false)
    this.onRefreshCurso.emit()
  }


}