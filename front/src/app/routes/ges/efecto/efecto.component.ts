import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TablePersonalEfectoComponent } from '../table-personal-efecto/table-personal-efecto.component';
import { TableObjetivosEfectoComponent } from '../table-objetivos-efecto/table-objetivos-efecto.component';
@Component({
  selector: 'app-efecto',
  imports: [
    SHARED_IMPORTS,
    CommonModule,
    NzMenuModule,
    TablePersonalEfectoComponent,
    TableObjetivosEfectoComponent
  ],
  templateUrl: './efecto.component.html',
  styleUrl: './efecto.component.less'
})
export class EfectoComponent {

}
