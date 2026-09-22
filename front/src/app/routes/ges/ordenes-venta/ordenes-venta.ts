import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SHARED_IMPORTS } from '@shared';
import { NavigationEnd, Router, isActive } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { TableOrdenVentaComponent } from '../table-orden-venta/table-orden-venta';
import { OrdenVentaFormComponent } from '../orden-venta-form/orden-venta-form';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { OrdenVentaMasivaDrawerComponent } from '../orden-venta-masiva-drawer/orden-venta-masiva-drawer';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-ordenes-venta',
  standalone: true,
  imports: [SHARED_IMPORTS, DatePipe, NzMenuModule, TableOrdenVentaComponent, OrdenVentaFormComponent,
    ObjetivoSearchComponent, OrdenVentaMasivaDrawerComponent],
  templateUrl: './ordenes-venta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesVentaComponent {

  private apiService = inject(ApiService)
  public router = inject(Router)

  ordenesSeleccionadas = model<any[]>([])
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  soloLectura = computed(() => this.currentUrl()==='/ges/ordenes-venta/detalle')
  masivaVisible = signal(false)
  refreshTick = signal(0)

  async bajaOrdenVenta() {
    if (this.ordenesSeleccionadas() && this.ordenesSeleccionadas().length != 1) return

    try {
      await firstValueFrom(this.apiService.anularOrdenesVenta(this.ordenesSeleccionadas()))
      this.ordenesSeleccionadas.set([])
      this.refreshTick.update(n => n + 1)
    } finally {
    }
  }

  ordenVentaGuardada() {
    this.refreshTick.update(n => n + 1)
  }



  ngOnInit(): void {
    if (this.currentUrl()!='ges/ordenes-venta/listado')
      this.router.navigateByUrl('ges/ordenes-venta/listado')
  }

}
