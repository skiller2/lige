import { Component, computed, effect, inject, input, model, output, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { FormBuilder } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ObjectViewerComponent } from '../../../shared/object-viewer/object-viewer';

@Component({
  selector: 'app-procesos-automaticos-drawer',
  imports: [SHARED_IMPORTS, NzDescriptionsModule, ReactiveFormsModule, 
    CommonModule, FormsModule, NzInputModule, ObjectViewerComponent, ],
  templateUrl: './procesos-automaticos-drawer.html',
  styleUrl: './procesos-automaticos-drawer.less'
})

export class ProcesosAutomaticosDrawerComponent {

  visible = model<boolean>(false);
  placement: NzDrawerPlacement = 'left';
  tituloDrawer = signal<string>("Detalle");
  logCod = model<number>(0);
  ParametroEntrada = signal<any>(null)
  Resultado = signal<any>(null)
  objectKeys = Object.keys;
  
  private apiService = inject(ApiService)
  disabled = input<boolean>(false)

  fb = inject(FormBuilder)
  formProcAuto = this.fb.group({
    ProcesoAutomaticoLogCodigo: 0,
    NombreProceso: "",
    FechaInicio: "",
    FechaFin: "",
    Descripcion: "",
  })
  

  constructor(private searchService: SearchService) { 
    
    effect(async() => { 
      const visible = this.visible()
      if (visible) {
        if (this.logCod()) {
          let res = await firstValueFrom(this.searchService.getProcesoAutomatico(this.logCod()))
          
          this.ParametroEntrada.set(JSON.parse(res[0].ParametroEntrada))
          this.Resultado.set(JSON.parse(res[0].Resultado))
          this.formProcAuto.reset(res[0])
        }else{
          this.ParametroEntrada.set(null)
          this.Resultado.set(null)
        }
        
      }
      
    })
  }

  ngOnInit(){}

}