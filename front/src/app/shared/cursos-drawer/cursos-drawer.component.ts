import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { Component, ChangeDetectionStrategy, model, input, computed, inject, viewChild, signal, TemplateRef, EventEmitter, output,  } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BehaviorSubject, firstValueFrom, debounceTime,switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CursoSearchComponent } from '../curso-search/curso-search.component';
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
      CursoSearchComponent,
      CommonModule],
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

  CursoHabilitacionId = input.required<number>()
  CursoHabilitacionIdForEdit = signal(0)

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

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    CursoHabilitacionCodigo: "",
    CursoHabilitacionId: 0,
    CursoHabilitacionCantidadHoras: 0,
    CursoHabilitacionVigencia: 0,
    ModalidadCursoModalidad: "",
    CursoHabilitacionInstructor: "",
    CentroCapacitacion: null,
    CentroCapacitacionSede: null
  })

  constructor(
    private searchService: SearchService
  ) { }

  async ngOnInit(): Promise<void> {

    this.CursoHabilitacionIdForEdit.set(0)

  }

  cambios = computed(async () => {
    const visible = this.visible()
    //this.ngForm().form.reset()
    this.ArchivosEstudioAdd = []
    if (visible) {
      //const per = this.selectedPeriod()
      if (this.CursoHabilitacionId() > 0) {
        let vals = await firstValueFrom(this.apiService.getListCursosHistory( { options: this.listOptions }, this.anio(), this.mes(), this.CursoHabilitacionId(),""))
        console.log("vals 1",vals.list[0])
        //let vals = await firstValueFrom(this.apiService.getEstudio(this.PersonalId(), this.PersonalEstudioId()));

        this.CursoHabilitacionIdForEdit.set(this.CursoHabilitacionId())
          vals.CursoHabilitacionCodigo = vals.list[0].CursoHabilitacionCodigo,
          vals.CursoHabilitacionId = vals.list[0].CursoHabilitacionId,
          vals.CursoHabilitacionCantidadHoras = vals.list[0].CursoHabilitacionCantidadHoras,
          vals.CursoHabilitacionVigencia = Number(vals.list[0].CursoHabilitacionVigencia),
          vals.ModalidadCursoModalidad = vals.list[0].ModalidadCursoModalidad,
          vals.CursoHabilitacionInstructor = vals.list[0].CursoHabilitacionInstructor,
          vals.CentroCapacitacion = vals.list[0].CentroCapacitacion,
          vals.CentroCapacitacionSede = vals.list[0].CentroCapacitacionSede

          console.log("vals",vals)
     
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

      //vals.CursoHabilitacionIdForEdit = this.CursoHabilitacionId()

      const res =  await firstValueFrom(this.apiService.setEstudio(vals))
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
      //this.fileUploaded = false
      this.onRefreshCurso.emit()
      //this.formCli$.next("")
    } catch (error) {

    }
    this.isSaving.set(false)
  }

  async deleteEstudio() {
     let vals = this.formCli.value
    let res = await firstValueFrom(this.apiService.deleteEstudio(vals))
    this.visible.set(false)
    this.onRefreshCurso.emit()
  }


}