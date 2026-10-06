import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NavigationEnd, Router } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { TableParametroGeneralComponent } from '../table-parametro-general/table-parametro-general';
import { ParametroGeneralFormComponent } from '../parametro-general-form/parametro-general-form';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-parametros-generales',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, TableParametroGeneralComponent, ParametroGeneralFormComponent],
  templateUrl: './parametros-generales.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametrosGeneralesComponent {

  private apiService = inject(ApiService)
  public router = inject(Router)

  // signal y no model(): la app usa withComponentInputBinding y el router, en cada navegación,
  // pisa todos los inputs de la pantalla con lo que trae la ruta (undefined para este)
  parametrosSeleccionados = signal<any[]>([])
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  soloLectura = computed(() => this.currentUrl()==='/config/parametros-generales/detalle')
  refreshTick = signal(0)
  childTableParametroGeneral = viewChild<TableParametroGeneralComponent>('tableParametroGeneral')

  async bajaParametroGeneral() {
    if (this.parametrosSeleccionados() && this.parametrosSeleccionados().length != 1) return

    try {
      await firstValueFrom(this.apiService.deleteParametroGeneral(this.parametrosSeleccionados()[0]))
      this.parametrosSeleccionados.set([])
      this.refreshTick.update(n => n + 1)
    } finally {
    }
  }

  parametroGeneralGuardado() {
    this.refreshTick.update(n => n + 1)
  }

  // Al grabar un alta se pasa directo a editar el registro recién creado
  parametroGeneralAlta(ParametroGeneralCodigo: string) {
    this.childTableParametroGeneral()?.clearSelection()
    this.parametrosSeleccionados.set([ParametroGeneralCodigo])
    this.refreshTick.update(n => n + 1)
    this.router.navigate(['/', 'config', 'parametros-generales', 'editar'])
  }

  ngOnInit(): void {
    if (this.currentUrl()!='config/parametros-generales/listado' && this.currentUrl()!='config/parametros-generales/alta')
      this.router.navigateByUrl('config/parametros-generales/listado')
  }

}
