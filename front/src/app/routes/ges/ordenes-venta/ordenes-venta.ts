import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ordenes-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, CommonModule],
  templateUrl: './ordenes-venta.html',
  styleUrl: './ordenes-venta.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesVentaComponent {}
