import { Component, inject, input, signal, model, ViewChild, viewChild } from '@angular/core'
import { SHARED_IMPORTS, listOptionsT } from '@shared'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { firstValueFrom } from 'rxjs'
import { TableSeguroListComponent } from 'src/app/routes/ges/table-seguros-list/table-seguros-list.component'
import { ApiService } from 'src/app/services/api.service'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { ReporteComponent } from 'src/app/shared/reporte/reporte.component'
import { PolizaSeguroComponent } from '../poliza-seguro/poliza-seguro.component'

import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-seguro',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzIconModule, TableSeguroListComponent, NzPopconfirmModule, NzMenuModule, NzButtonModule, ReporteComponent, PolizaSeguroComponent],
  templateUrl: './seguro.component.html',
  styleUrl: './seguro.component.less'
})
export class SeguroComponent {


  fechaActual = signal(new Date())
  fechaseguro = model(new Date())
  calendarView = signal(false)
  selectedPeriod = { year: 0, month: 0 }
  selectedOption = model("APG")
  isActiveProcess = signal(true)

  public apiService = inject(ApiService)
  constructor() { }

  async processInsurrance() {
    this.calendarView.set(true)
  }

  async processInsurranceClose() {
    this.calendarView.set(false)
  }

  async send() {
    this.selectedPeriod.year = (this.fechaseguro() as Date).getFullYear()
    this.selectedPeriod.month = (this.fechaseguro() as Date).getMonth() + 1
    const res = await firstValueFrom(this.apiService.processInsurance(this.selectedPeriod.year, this.selectedPeriod.month))

  }

  ngOnInit(): void {

    this.fechaseguro.set(new Date(this.fechaActual().getFullYear(), this.fechaActual().getMonth() - 1, 1))
  }

  onTabsetChange(_event: any) {
    switch (_event.index) {
      case 2: //Poliza
        this.isActiveProcess.set(false)
        break;
        default:
          this.isActiveProcess.set(true)
        break;
    }

  }
  
  //onTabChanged(selectedIndex: number): void {
  //  window.dispatchEvent(new Event('resize'));
  //}


}
