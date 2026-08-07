import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { I18nPipe } from '@delon/theme';
import { AngularUtilService } from 'angular-slickgrid';
import { TablePrecioEfectosComponent } from '../table-precio-efectos/table-precio-efectos';
import { PrecioEfectosDrawerComponent } from '../precio-efectos-drawer/precio-efectos-drawer';

@Component({
  selector: 'app-precio-efectos',
  standalone: true,
  providers: [AngularUtilService],
  imports: [SHARED_IMPORTS, CommonModule, I18nPipe, TablePrecioEfectosComponent, PrecioEfectosDrawerComponent],
  templateUrl: './precio-efectos.html',
  styleUrl: './precio-efectos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrecioEfectosComponent {

  refreshPrecios = signal<number>(0)
  precioSeleccionado = signal<any | null>(null)
  visibleModificarValor = signal<boolean>(false)

  childTablePrecioEfectos = viewChild<TablePrecioEfectosComponent>('tablePrecioEfectos')

  modificar = computed(() => !!this.precioSeleccionado()?.EfectoId)

  refreshGridNow() {
    this.refreshPrecios.update(v => v + 1)
  }
}
