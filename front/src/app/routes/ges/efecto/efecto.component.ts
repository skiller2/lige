
import { Component, computed, effect, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TablePersonalEfectoComponent } from '../table-personal-efecto/table-personal-efecto.component';
import { TableObjetivosEfectoComponent } from '../table-objetivos-efecto/table-objetivos-efecto.component';
import { TableDepositoEfectoComponent } from '../table-deposito-efecto/table-deposito-efecto';
import { TableProveedoresEfectoComponent } from '../table-proveedores-efecto/table-proveedores-efecto';
import { TableEfectoGeneralComponent } from '../table-efecto-general/table-efecto-general';
import { MovimientoStockComponent } from '../movimiento-stock/movimiento-stock';
import { SettingsService } from '@delon/theme';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
@Component({
  selector: 'app-efecto',
  imports: [
    SHARED_IMPORTS,
    NzMenuModule,
    TablePersonalEfectoComponent,
    TableObjetivosEfectoComponent,
    TableDepositoEfectoComponent,
    TableProveedoresEfectoComponent,
    TableEfectoGeneralComponent,
    MovimientoStockComponent,
  ],
  templateUrl: './efecto.component.html',
  styleUrl: './efecto.component.less',
})
export class EfectoComponent {
  private settingsService = inject(SettingsService)
  private route = inject(ActivatedRoute)

  activeTab = toSignal(
    this.route.params.pipe(map(({ tab }) => tab || 'general')),
    { initialValue: 'general' }
  )

  refreshTickGeneral = signal(0)
  refreshTickPersonal = signal(0)
  refreshTickObjetivos = signal(0)
  refreshTickDeposito = signal(0)
  refreshTickProveedores = signal(0)

  visitedTabs = signal<Set<string>>(new Set())

  private trackVisited = effect(() => {
    const tab = this.activeTab()
    if (!tab) return
    const visited = this.visitedTabs()
    if (!visited.has(tab)) {
      this.visitedTabs.set(new Set(visited).add(tab))
    }
  })

  ngOnInit() {
    this.settingsService.setLayout('collapsed', true)
  }

  reloadGrid() {
    switch (this.activeTab()) {
      case 'general':     this.refreshTickGeneral.update(n => n + 1); break
      case 'personal':    this.refreshTickPersonal.update(n => n + 1); break
      case 'objetivos':   this.refreshTickObjetivos.update(n => n + 1); break
      case 'deposito':    this.refreshTickDeposito.update(n => n + 1); break
      case 'proveedores': this.refreshTickProveedores.update(n => n + 1); break
    }
  }
}
