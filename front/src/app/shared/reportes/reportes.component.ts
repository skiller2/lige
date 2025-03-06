import { Component, EventEmitter, Input, Output, ViewChild, forwardRef, inject, input, model, signal } from '@angular/core'
import { SHARED_IMPORTS } from '@shared'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzModalModule } from 'ng-zorro-antd/modal'
import { firstValueFrom } from 'rxjs'
import { SearchService } from 'src/app/services/search.service';

@Component({
  selector: 'app-reportes',
  imports: [...SHARED_IMPORTS,NzButtonModule, NzModalModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.less'
})
export class ReportesComponent {

  isVisible = model(false)
  reportTitle = input("")
  private searchService = inject(SearchService)

  async searchReportParameters(title:string){
   console.log("pase ", title)
   let res = await firstValueFrom(this.searchService.getInfoFilterReport(title))

  }


}
