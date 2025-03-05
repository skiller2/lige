import { Component, inject, input, signal,model} from '@angular/core'
import { SHARED_IMPORTS, listOptionsT } from '@shared'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { firstValueFrom } from 'rxjs'
import {TableSeguroListComponent} from 'src/app/shared/table-seguros-list/table-seguros-list.component'
import { ApiService, doOnSubscribe } from 'src/app/services/api.service'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { ReportesComponent } from 'src/app/shared/reportes/reportes.component'

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message'

@Component({
  selector: 'app-seguro',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzIconModule ,TableSeguroListComponent,NzPopconfirmModule,NzMenuModule,NzButtonModule,ReportesComponent
  ],
  templateUrl: './seguro.component.html',
  styleUrl: './seguro.component.less'
})
export class SeguroComponent {


 fechaActual = signal(new Date())
 fechaseguro = model(new Date())
 calendarView = signal(false)
 selectedPeriod = { year: 0, month: 0 }
 isVisible = false
 selectedOption = model("APG");

public apiService = inject(ApiService)
constructor(private nzMessageService: NzMessageService) {}

 async processInsurrance(){
  this.calendarView.set(true) 
 }

 async processInsurranceClose(){
  this.calendarView.set(false) 
 }

 async send() {
  this.selectedPeriod.year = (this.fechaseguro() as Date).getFullYear()
  this.selectedPeriod.month = (this.fechaseguro() as Date).getMonth() + 1
  const res = await firstValueFrom(this.apiService.processInsurance(this.selectedPeriod.year, this.selectedPeriod.month))

 }

 showModal(): void {
  this.isVisible = true;
}

 ngOnInit(): void {
  
   this.fechaseguro.set(new Date(this.fechaActual().getFullYear(), this.fechaActual().getMonth() - 1, 1))
 }

}
