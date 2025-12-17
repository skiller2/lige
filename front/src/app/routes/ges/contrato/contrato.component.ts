import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';
import { I18nPipe, SettingsService } from '@delon/theme';

@Component({
  selector: 'app-contrato',
  imports: [ SHARED_IMPORTS,
    CommonModule,
    I18nPipe],
  templateUrl: './contrato.component.html',
  styleUrl: './contrato.component.less',
})
export class ContratoComponent {

  onTabsetChange(_event: any) {
    console.log("_event.index ", _event.index)
    switch (_event.index) {
      case 4: //INSERT
        //this.childAlta().newRecord()
        break
      case 3: //DETAIL
        //this.childDeta().viewRecord(true)
        break;
      case 2: //EDIT
       // this.childEdit().viewRecord(false)
        break;
        default:
        break;
    }

  }

}
