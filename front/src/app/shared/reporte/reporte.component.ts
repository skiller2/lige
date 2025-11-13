import { Component, inject, input, signal, model, ViewChild, viewChild, computed, ElementRef } from '@angular/core'
import { SHARED_IMPORTS } from '@shared'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzModalModule } from 'ng-zorro-antd/modal'
import { firstValueFrom, map } from 'rxjs'
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
  DefaultValues: any
  Value: null
}


@Component({
  selector: '[app-reporte]',
  imports: [...SHARED_IMPORTS, CommonModule, NzButtonModule, NzModalModule, NzDatePickerModule, NzMenuModule],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.less',
  host: {
    "(click)": "onClick($event)"
 }
})

export class ReporteComponent {

  isVisible = signal(false)
  reportTitle = input('',{alias: 'app-reporte'})
  isfilterLoad = signal(false)
  filtrosReporte = signal<Parameter[]>([])
  private searchService = inject(SearchService)
  public apiService = inject(ApiService)
  isLoading = signal(false)

  btnDescargar = viewChild<ElementRef<HTMLButtonElement>>('btnDescargar');

  getFiltros() {
    return this.filtrosReporte().map((f:any) => { return { [f.Name]: f.Value } })
  }

  async searchReportParameters(title: string) {
    this.isLoading.set(true)
    try {
      const res:any = await firstValueFrom(this.searchService.getInfoFilterReport(title).pipe(map((res: any) => res.value)))

//TODO: Tomar valores por omision dentro del forEach
      res.forEach((obj: any): void => {
        if (obj.DefaultValues.length > 0) {
          obj.Value = obj.DefaultValues[0]
        }
      });

      this.filtrosReporte.set(res)

      if (res.length == 0) {
        this.isLoading.set(false);
        // Simular click del botón de descarga
        setTimeout(() => this.btnDescargar()?.nativeElement.click(), 500);
        return;
      }

      this.isfilterLoad.set(true)

    } catch (error){

      this.isVisible.set(false)
     
    }
    this.isLoading.set(false)

  }

  onClick(evt: any) {

    if (!this.isfilterLoad()) 
      this.searchReportParameters(this.reportTitle())
    this.isVisible.set(true)
  }

}
