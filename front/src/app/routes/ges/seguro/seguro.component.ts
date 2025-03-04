import { Component, inject, input, signal,model} from '@angular/core'
import { SHARED_IMPORTS, listOptionsT } from '@shared'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { firstValueFrom } from 'rxjs'
import {TableSeguroListComponent} from 'src/app/shared/table-seguros-list/table-seguros-list.component'
import { ApiService, doOnSubscribe } from 'src/app/services/api.service'
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm'
import { NzMenuModule } from 'ng-zorro-antd/menu'

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message'

@Component({
  selector: 'app-seguro',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzIconModule ,TableSeguroListComponent,NzPopconfirmModule,NzMenuModule,NzButtonModule
  ],
  templateUrl: './seguro.component.html',
  styleUrl: './seguro.component.less'
})
export class SeguroComponent {


 periodo = signal(new Date())
 fechaseguro = model(new Date())
 calendarView = signal(false)
 selectedPeriod = { year: 0, month: 0 }

public apiService = inject(ApiService)
constructor(private nzMessageService: NzMessageService) {}

 async processInsurrance(){
  this.calendarView.set(true) 
 }

 async processInsurranceClose(){
  this.calendarView.set(false) 
 }

 send(): void {
  this.selectedPeriod.year = (this.fechaseguro() as Date).getFullYear()
  this.selectedPeriod.month = (this.fechaseguro() as Date).getMonth() + 1
  // const res = await firstValueFrom(this.apiService.processInsurance(this.selectedPeriod.year, this.selectedPeriod.month))
 }


 ngOnInit(): void {
   const fechaActual = new Date();
   this.fechaseguro.set(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1))
 }

}
