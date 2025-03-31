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
import { CentroCapacitacionSedeSearchComponent } from '../centro-capacitacion-sede-search/centro-capacitacion-sede-search.component';



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
    selector: 'app-sedes-drawer',
    imports: [SHARED_IMPORTS, 
      NzUploadModule, 
      NzAutocompleteModule,
      CommonModule,
      CentroCapacitacionSedeSearchComponent
    ],
    templateUrl: './sedes-drawer.component.html',
    styleUrl: './sedes-drawer.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})



export class SedesDrawerComponent {

  ArchivosEstudioAdd: any[] = [];
  disabled =  input<boolean>(false)
  RefreshCurso =  model<boolean>(false)
  private apiService = inject(ApiService)

  private notification = inject(NzNotificationService)

  CentroCapacitacionId = input.required<number>()
  PersonalLicenciaAplicaPeriodoHorasMensuales = signal(null)

  options: any[] = [];

  currentDate = new Date()
  anio = signal(this.currentDate.getFullYear())
  mes = signal(this.currentDate.getMonth() + 1)
  
  isSaving= model<boolean>(false)
  placement: NzDrawerPlacement = 'left';
  visible = model<boolean>(false)

  onRefreshInstituciones = output<void>();
  uploading$ = new BehaviorSubject({loading:false,event:null});

  listOptions: listOptionsT = {
    filtros: [],
    sort: null,
    extra: null,
  }

  fb = inject(FormBuilder)
  formCli = this.fb.group({
    CentroCapacitacionId: 0,
    CentroCapacitacionSedeId:0
  })

  constructor(
    private searchService: SearchService
  ) {
    effect(async() => {
      const visible = this.visible()
 
    if (visible) {
      if (this.CentroCapacitacionId() > 0) {

        let vals = await firstValueFrom(this.apiService.getListInstitucionesHistory( { options: this.listOptions }, this.CentroCapacitacionId()))
      
        console.log("vals",vals)
        vals.CentroCapacitacionId = vals.list[0].CentroCapacitacionId,
        vals.CentroCapacitacionSedeId = vals.list[0].CentroCapacitacionSedeId
      
          
        this.formCli.patchValue(vals)
        this.formCli.markAsUntouched()
        this.formCli.markAsPristine()


        if (this.disabled()) {
          this.formCli.disable()
        } else {
          this.formCli.enable()

        }
      }
    }
    })
   }

  async ngOnInit(): Promise<void> {


  }

  async saveSede() {

    this.isSaving.set(true)
    let vals = this.formCli.value
    try {

      vals.CentroCapacitacionId = this.CentroCapacitacionId()
      
      const res =  await firstValueFrom(this.apiService.setInstituciones(vals))

      //if(res.data?.list[0]?.CentroCapacitacionId > 0){
        
       //   this.CentroCapacitacionIdForEdit.set(res.data?.list[0]?.CentroCapacitacionId)

        //  this.formCli.patchValue({
        //      CentroCapacitacionId: res.data?.list[0]?.CentroCapacitacionId,
        //  })

          

       // }  
      
      this.formCli.markAsUntouched()
      this.formCli.markAsPristine()
      this.onRefreshInstituciones.emit()
    } catch (error) {

    }
    this.isSaving.set(false)
  }

  async deleteInstitucion() {
     let vals = this.formCli.value
     
    //let res = await firstValueFrom(this.apiService.deleteInstitucion(vals))
    this.visible.set(false)
    this.onRefreshInstituciones.emit()
  }


}