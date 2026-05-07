import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-table-proveedores-efecto',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './table-proveedores-efecto.html',
  standalone: true
})
export class TableProveedoresEfectoComponent {
  refreshGrid = input<number>(0);
}
