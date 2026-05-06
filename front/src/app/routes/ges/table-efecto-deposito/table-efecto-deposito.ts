import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-table-efecto-deposito',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './table-efecto-deposito.html',
  standalone: true
})
export class TableEfectoDepositoComponent {
  refreshGrid = input<number>(0);
}
