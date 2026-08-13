import { Component, inject, model, signal } from '@angular/core'
import { SHARED_IMPORTS } from '@shared'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { SettingsService } from '@delon/theme'
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component'

@Component({
  selector: 'app-orden-venta',
  standalone: true,
  imports: [...SHARED_IMPORTS, NzIconModule, NzMenuModule, ObjetivoSearchComponent],
  templateUrl: './orden-venta.html',
  styleUrl: './orden-venta.less'
})
export class OrdenVentaComponent {
  periodo = model<any>(new Date())
  anio = signal(0)
  mes = signal(0)
  reloadForm = model<any>(false)
  objetivoIdSelected = model(0)
  private settingsService = inject(SettingsService)

  ngAfterViewInit(): void {
    const now = new Date()

    this.anio.set(
      Number(localStorage.getItem('anio')) > 0
        ? Number(localStorage.getItem('anio'))
        : now.getFullYear()
    )
    this.mes.set(
      Number(localStorage.getItem('mes')) > 0
        ? Number(localStorage.getItem('mes'))
        : now.getMonth() + 1
    )

    this.periodo.set(new Date(this.anio(), this.mes() - 1, 1))

    this.settingsService.setLayout('collapsed', true)
  }

  dateChange(result: Date): void {
    this.anio.set(result.getFullYear())
    this.mes.set(result.getMonth() + 1)

    localStorage.setItem('anio', String(this.anio()))
    localStorage.setItem('mes', String(this.mes()))
  }

  resetForm() {
    this.reloadForm.set(true)
  }

}
