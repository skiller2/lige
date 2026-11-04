import { Component, computed, effect, inject, input, model, output, resource, signal, untracked, viewChild } from '@angular/core';
import { SHARED_IMPORTS, listOptionsT } from '@shared';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AppDownFileDirective } from '../../../shared/down-file/down-file.directive';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-intercambio-bancos-modal',
  templateUrl: './intercambio-bancos-modal.html',
  styles: [`
    .banco-titulo ::ng-deep .ant-list-item-meta-title {
      font-size: 13px;
      line-height: 18px;
      margin-bottom: 0;
    }
    .banco-pendientes ::ng-deep .ant-list-item-meta-description {
      font-size: 11px;
      line-height: 16px;
    }
    .generar-archivo {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 320px;
      max-width: 100%;
      margin: 0 auto;
    }
    .generar-archivo-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.65);
    }
    .generar-archivo nz-select {
      width: 100%;
    }
  `],
  imports: [
    ...SHARED_IMPORTS,
    NzModalModule,
    NzButtonModule,
    NzListModule,
    NzSelectModule,
    FormField,
  ],
})
export class IntercambioBancosModalComponent {
  private readonly searchService = inject(SearchService);
  private readonly apiService = inject(ApiService);
  private readonly modal = inject(NzModalService);

  isVisible = model(false)
  anio = input<number>(0)
  mes = input<number>(0)
  options = input<listOptionsT>({ filtros: [], sort: null })
  tabIndex = input<number>(0)
  onCambio = output()

  private readonly defaultIntercambioBancos: { BancoId: number | null } = {
    BancoId: null,
  }

  readonly intercambioBancos = signal({ ...this.defaultIntercambioBancos })
  readonly formIntercambioBancos = form(this.intercambioBancos)

  // Cada vez que se abre el modal arranca con el formulario limpio
  private readonly resetForm = effect(() => {
    if (this.isVisible())
      untracked(() => this.intercambioBancos.set({ ...this.defaultIntercambioBancos }))
  })

  readonly titulo = computed(() =>
    this.anio() && this.mes()
      ? `Intercambio Bancos - Período ${String(this.mes()).padStart(2, '0')}/${this.anio()}`
      : 'Intercambio Bancos'
  )

  readonly bancos = resource({
    params: () => this.isVisible() || undefined,
    loader: () => firstValueFrom(this.searchService.getBancosIntercambioOptions()),
    defaultValue: []
  });

  // Mismos datos que la solapa Movimientos Pendientes (lige.dbo.liqmvbanco), sin filtros
  readonly movimientos = resource({
    params: () => this.isVisible() || undefined,
    loader: async () => {
      const response = await firstValueFrom(this.apiService.getMovimientosBanco(
        { anio: this.anio(), mes: this.mes(), options: { filtros: [], sort: null } }
      ))
      return (response?.list ?? []) as any[]
    },
    defaultValue: []
  });

  private readonly formatoImporte = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
  private readonly formatoFecha = new Intl.DateTimeFormat('es-AR')

  // Resumen de movimientos pendientes agrupado por banco_id
  readonly pendientesPorBanco = computed(() => {
    const resumen = new Map<number, { cantidad: number, importe: number, envios: Set<number>, periodos: Set<string>, fecha: Date | null, texto: string }>()
    for (const mov of this.movimientos.value()) {
      const item = resumen.get(mov.banco_id) ?? { cantidad: 0, importe: 0, envios: new Set<number>(), periodos: new Set<string>(), fecha: null, texto: '' }
      item.cantidad++
      item.importe += Number(mov.importe)
      item.envios.add(mov.envio_nro)
      if (mov.anio && mov.mes) item.periodos.add(`${String(mov.mes).padStart(2, '0')}/${mov.anio}`)
      const fecha = mov.fecha ? new Date(mov.fecha) : null
      if (fecha && (!item.fecha || fecha > item.fecha)) item.fecha = fecha
      resumen.set(mov.banco_id, item)
    }

    for (const item of resumen.values()) {
      const partes = [
        `${item.cantidad} ${item.cantidad == 1 ? 'movimiento pendiente' : 'movimientos pendientes'}`,
        `Total ${this.formatoImporte.format(item.importe)}`,
        `Envío ${[...item.envios].join(', ')}`,
      ]
      if (item.fecha) partes.push(this.formatoFecha.format(item.fecha))
      item.texto = partes.join(' · ')
    }
    return resumen
  })

  // Solo los bancos que tienen movimientos pendientes
  readonly bancosConPendientes = computed(() =>
    this.bancos.value().filter(banco => this.pendientesPorBanco().has(banco.value))
  )

  private nombreBanco(descripcion: string) {
    return /^banco\b/i.test(descripcion) ? descripcion : `Banco ${descripcion}`
  }

  private textoPeriodos(periodos: Set<string>) {
    return periodos.size ? [...periodos].join(', ') : 'sin período'
  }

  // Mensaje de confirmación previo a confirmar los depósitos pendientes: banco, período, importe total y cantidad de registros
  mensajeConfirmacion(banco: { value: number, label: string }) {
    const pendiente = this.pendientesPorBanco().get(banco.value)
    if (!pendiente)
      return `No hay depósitos pendientes correspondientes al ${this.nombreBanco(banco.label)}.`
    const registros = `${pendiente.cantidad} ${pendiente.cantidad == 1 ? 'registro' : 'registros'}`
    return `Se confirmarán los depósitos pendientes correspondientes al ${this.nombreBanco(banco.label)} para el período ${this.textoPeriodos(pendiente.periodos)}, por un importe total de ${this.formatoImporte.format(pendiente.importe)}, con ${registros}.`
  }

  // Mensaje de confirmación previo a eliminar el lote pendiente: banco, período e importe total
  mensajeEliminacion(banco: { value: number, label: string }) {
    const pendiente = this.pendientesPorBanco().get(banco.value)
    if (!pendiente)
      return `No hay lote pendiente correspondiente al ${this.nombreBanco(banco.label)} para el período ${String(this.mes()).padStart(2, '0')}/${this.anio()}.`
    return `Se eliminará el lote pendiente correspondiente al ${this.nombreBanco(banco.label)} para el período ${this.textoPeriodos(pendiente.periodos)}, por un importe total de ${this.formatoImporte.format(pendiente.importe)}.`
  }

  readonly bodyArchivoBanco = computed(() => ({
    anio: this.anio(),
    mes: this.mes(),
    options: this.options(),
    BancoId: Number(this.intercambioBancos().BancoId),
    tabIndex: this.tabIndex(),
  }))

  readonly bancoSeleccionado = computed(() => {
    const banco = this.bancos.value().find(b => b.value == this.intercambioBancos().BancoId)
    return banco ? this.nombreBanco(banco.label) : ''
  })

  // app-down-file oculto: recién se dispara al aceptar el popconfirm del botón Generar archivo
  private readonly downFile = viewChild('downFile', { read: AppDownFileDirective })
  readonly generando = signal(false)

  generar() {
    this.downFile()?.onClick(new MouseEvent('click'))
  }

  // Se ejecuta antes de la descarga (app-down-file): consulta el resumen y pide confirmación
  confirmarGeneracion = async (ev: MouseEvent): Promise<boolean> => {
    let resumen: any
    try {
      resumen = await firstValueFrom(this.apiService.getResumenArchivoBanco(this.bodyArchivoBanco()))
    } catch {
      return false
    }

    const descripcion: string = resumen.BancoDescripcion ?? ''
    const banco = /^banco\b/i.test(descripcion) ? descripcion : `Banco ${descripcion}`
    const importe = this.formatoImporte.format(resumen.importeTotal)
    const registros = `${resumen.cantidadRegistros} ${resumen.cantidadRegistros == 1 ? 'registro' : 'registros'}`

    return new Promise<boolean>(resolve => {
      this.modal.confirm({
        nzTitle: 'Generación de archivos',
        nzContent: `Se generará el archivo correspondiente al ${banco} para el período ${resumen.mes}/${resumen.anio}, por un importe total de ${importe}, con ${registros}. ¿Confirma?`,
        nzOkText: 'Generar',
        nzCancelText: 'Cancelar',
        nzOnOk: () => resolve(true),
        nzOnCancel: () => resolve(false),
      })
    })
  }

  // Misma acción que "Confirma depósitos pendientes" del menú Acciones, pero solo para el banco indicado
  async confirmar(BancoId: number) {
    try {
      await firstValueFrom(this.apiService.confirmaMovimientosBanco({ year: this.anio(), month: this.mes() }, BancoId))
      this.movimientos.reload()
      this.onCambio.emit()
    } catch (e) {

    }
  }

  // Misma acción que "Elimina archivo pendiente banco ..." del menú Acciones
  async eliminar(BancoId: number) {
    try {
      await firstValueFrom(this.apiService.eliminaMovimientosBanco(BancoId))
      this.movimientos.reload()
      this.onCambio.emit()
    } catch (e) {

    }
  }

}
