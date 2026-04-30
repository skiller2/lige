import { Component, computed, effect, inject, input, model, output, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

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
  selector: 'app-procesos-automaticos-detalle',
  imports: [SHARED_IMPORTS, NzDescriptionsModule, ReactiveFormsModule, FormsModule, NzInputModule, ObjectViewerComponent],
  templateUrl: './procesos-automaticos-detalle.html',
  styleUrl: './procesos-automaticos-detalle.less'
})

export class ProcesosAutomaticosDetalleComponent {

  logCod = model<number>(0);
  ParametroEntrada = signal<any>(null)
  Resultado = signal<any>(null)
  auditHistory = signal<any[]>([])
  objectKeys = Object.keys;
  
  private apiService = inject(ApiService)
  disabled = input<boolean>(false)

  fb = inject(FormBuilder)
  formProcAuto = this.fb.group({
    EventoLogCodigo: 0,
    NombreProceso: "",
    FechaInicio: "",
    FechaFin: "",
    Descripcion: "",
  })
  

  constructor(private searchService: SearchService) { 
    
    effect(async() => {
      if (this.logCod()) {
        let res = await firstValueFrom(this.searchService.getProcesoAutomatico(this.logCod()))

        this.ParametroEntrada.set(JSON.parse(res[0].ParametroEntrada))
        this.Resultado.set(JSON.parse(res[0].Resultado))
        this.auditHistory.set([
          { usuario: res[0].AudUsuarioIng, fecha: this.formatDate(res[0].AudFechaIng), accion: 'Creación' },
          { usuario: res[0].AudUsuarioMod, fecha: this.formatDate(res[0].AudFechaMod), accion: 'Modificación' }
        ])
        this.formProcAuto.reset(res[0])
      }else{
        this.ParametroEntrada.set(null)
        this.Resultado.set(null)
        this.auditHistory.set([])
      }

    })
  }

  ngOnInit(){}

  private formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
  }

}