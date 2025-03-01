import { Component, inject, input, signal} from '@angular/core'
import { SHARED_IMPORTS, listOptionsT } from '@shared'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { firstValueFrom } from 'rxjs'
import {TableSeguroListComponent} from 'src/app/shared/table-seguros-list/table-seguros-list.component'
import { ApiService, doOnSubscribe } from 'src/app/services/api.service'

@Component({
  selector: 'app-seguro',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzIconModule ,TableSeguroListComponent],
  templateUrl: './seguro.component.html',
  styleUrl: './seguro.component.less'
})
export class SeguroComponent {


 periodo = signal(new Date())
 calendarView = signal(false)
 selectedPeriod = { year: 0, month: 0 }

public apiService = inject(ApiService)

 async processInsurrance(){
  this.calendarView.set(true) 
 }

 async processInsurranceClose(){
  this.calendarView.set(false) 
 }

 async send(){
  this.calendarView.set(false) 
  this.selectedPeriod.year = (this.periodo() as Date).getFullYear()
  this.selectedPeriod.month = (this.periodo() as Date).getMonth() + 1
  const res = await firstValueFrom(this.apiService.processInsurance(this.selectedPeriod.year, this.selectedPeriod.month))
 }


 ngOnInit(): void {
   const fechaActual = new Date();
   this.periodo.set(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1))
 }

}
