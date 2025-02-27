import { Component} from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {TableSeguroListComponent} from 'src/app/shared/table-seguros-list/table-seguros-list.component'

@Component({
  selector: 'app-seguro',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzIconModule ,TableSeguroListComponent],
  templateUrl: './seguro.component.html',
  styleUrl: './seguro.component.less'
})
export class SeguroComponent {


}
