import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-table-efecto-efectos',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './table-efecto-efectos.html',
  standalone: true
})
export class TableEfectoEfectosComponent {
  refreshGrid = input<number>(0);
}
