import { Component, inject, input, signal, model, ViewChild, viewChild } from '@angular/core'
import { SHARED_IMPORTS } from '@shared'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzMenuModule } from 'ng-zorro-antd/menu'
import { TableOrdenesDeVentaComponent } from '../table-ordenes-de-venta/table-ordenes-de-venta'
import { SettingsService } from '@delon/theme';

@Component({
  selector: 'app-ordenes-de-venta',
  imports: [...SHARED_IMPORTS, NzIconModule, NzMenuModule, TableOrdenesDeVentaComponent],
  templateUrl: './ordenes-de-venta.html',
  styleUrl: './ordenes-de-venta.less'
})
export class OrdenesDeVentaComponent {
  periodo = model<any>(new Date())
  anio = signal(0)
  mes = signal(0)

    private settingsService = inject(SettingsService)

  
  ngAfterViewInit(): void {
    const now = new Date(); //date

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
    this.anio.set(result.getFullYear());
    this.mes.set(result.getMonth() + 1);

    localStorage.setItem('anio', String(this.anio()));
    localStorage.setItem('mes', String(this.mes()));

  }
}
