import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { I18nPipe } from '@delon/theme';
import { AngularUtilService } from 'angular-slickgrid';
import { TablePrecioEfectosComponent } from '../table-precio-efectos/table-precio-efectos';

@Component({
  selector: 'app-precio-efectos',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule, I18nPipe, TablePrecioEfectosComponent],
  templateUrl: './precio-efectos.html',
  styleUrl: './precio-efectos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrecioEfectosComponent {

  refreshPrecios = signal<number>(0)
  childTablePrecioEfectos = viewChild<TablePrecioEfectosComponent>('tablePrecioEfectos')

  refreshGridNow() {
    this.refreshPrecios.update(v => v + 1)
  }
}
