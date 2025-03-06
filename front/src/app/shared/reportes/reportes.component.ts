import { Component, inject, input, signal,model, ViewChild, viewChild} from '@angular/core'
import { SHARED_IMPORTS } from '@shared'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzModalModule } from 'ng-zorro-antd/modal'
import { firstValueFrom } from 'rxjs'
import { SearchService } from 'src/app/services/search.service'
import { ApiService, doOnSubscribe } from 'src/app/services/api.service'
import { CommonModule } from '@angular/common'
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker'
import { NzMenuModule } from 'ng-zorro-antd/menu'


interface Parameter {
  Name: string;
  ParameterType: string;
  Prompt: string;
  ValidValues: { Value: string; Label: string }[]; 
}


@Component({
  selector: 'app-reportes',
  imports: [...SHARED_IMPORTS,CommonModule,NzButtonModule, NzModalModule,NzDatePickerModule,NzMenuModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.less'
})

export class ReportesComponent {

  isVisible = model(false)
  reportTitle = signal("")
  arrayResult = signal<Parameter[]>([])
  private searchService = inject(SearchService)
  public apiService = inject(ApiService)
  filterArray = signal<{ [key: string]: string }[]>([])
  fecha = signal("")
  nzvalue = null
  fechaActual = signal(new Date())

  async searchReportParameters(title:string){
   this.fecha.set("")
   this.reportTitle.set(title)
   let res = await firstValueFrom(this.searchService.getInfoFilterReport(title))
   this.arrayResult.set(res.value)

   this.filterArray.set([
    this.arrayResult().reduce((acc: { [key: string]: string }, item) => {
      acc[item.Name] = ''
      return acc
    }, {})
  ])
  
  }

  async onParamChange(paramName: string,ParameterType:string, value: any) {
    //console.log(`El parámetro ${paramName} cambió a:`, value);
    this.filterArray.update(arr => {
      return arr.map(obj => {
        if (obj.hasOwnProperty(paramName)) {
          return { ...obj, [paramName]: value }
        }
        return obj
      })
    })
  }

}
