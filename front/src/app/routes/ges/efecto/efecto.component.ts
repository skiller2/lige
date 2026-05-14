
import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TablePersonalEfectoComponent } from '../table-personal-efecto/table-personal-efecto.component';
import { TableObjetivosEfectoComponent } from '../table-objetivos-efecto/table-objetivos-efecto.component';
import { TableDepositoEfectoComponent } from '../table-deposito-efecto/table-deposito-efecto';
import { TableProveedoresEfectoComponent } from '../table-proveedores-efecto/table-proveedores-efecto';
import { TableEfectoGeneralComponent } from '../table-efecto-general/table-efecto-general';
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
    TableEfectoGeneralComponent
  ],
  templateUrl: './efecto.component.html',
  styleUrl: './efecto.component.less',
})
export class EfectoComponent {
  private settingsService = inject(SettingsService)
  private route = inject(ActivatedRoute)

  activeTab = toSignal(
    this.route.params.pipe(map(p => (p['tab'] as string) || 'general')),
    { initialValue: 'general' }
  )
  refreshTick = signal(0)

  ngOnInit() {
    this.settingsService.setLayout('collapsed', true)
  }

  reloadGrid() {
    this.refreshTick.update(n => n + 1)
  }
}
