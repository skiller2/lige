import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-table-efecto-proveedores',
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './table-efecto-proveedores.html',
  standalone: true
})
export class TableEfectoProveedoresComponent {
  refreshGrid = input<number>(0);
}
