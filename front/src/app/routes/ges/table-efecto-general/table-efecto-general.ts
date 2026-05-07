import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-table-efecto-general',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './table-efecto-general.html',
  standalone: true
})
export class TableEfectoGeneralComponent {
  refreshGrid = input<number>(0);
}
