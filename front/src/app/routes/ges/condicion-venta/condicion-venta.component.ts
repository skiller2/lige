import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';
import { I18nPipe, SettingsService } from '@delon/theme';
import { TableCondicionVentaComponent } from '../table-condicion-venta/table-condicion-venta.component';
import { AngularUtilService } from 'angular-slickgrid';

@Component({
  selector: 'app-condicion-venta',
  standalone: true,
  providers: [AngularUtilService],
  imports: [ SHARED_IMPORTS,
    CommonModule,
    I18nPipe,
    TableCondicionVentaComponent],
  templateUrl: './condicion-venta.component.html', 
  styleUrl: './condicion-venta.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondicionVentaComponent {

  periodo = signal<Date>(new Date())
  
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
