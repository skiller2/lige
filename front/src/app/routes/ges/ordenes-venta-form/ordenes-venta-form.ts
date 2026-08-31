import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { disabled, form, FormField, required, submit } from '@angular/forms/signals';
import { ClienteSearchComponent } from '../../../shared/cliente-search/cliente-search.component';
import { ObjetivoSearchComponent } from '../../../shared/objetivo-search/objetivo-search.component';
import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';

// Campos editables de la cabecera. Cliente y objetivo van por Id: es lo que guarda el backend, y las
// descripciones que muestra la grilla las resuelven los buscadores.
export interface OrdenVentaCabeceraFormModel {
  NroOrdenVenta: number | null;
  Fecha: Date | null;
  ClienteId: number | null;
  ObjetivoId: number | null;
  EstadoOrdenVentaCodigo: string;
  ImporteTotalAFacturar: any;
}

const texto = (valor: any): string => String(valor ?? '').trim();

const numero = (valor: any): number | null =>
  valor == null || texto(valor) === '' ? null : Number(valor);

@Component({
  selector: 'app-ordenes-venta-form',
  standalone: true,
  imports: [SHARED_IMPORTS, FormField, ClienteSearchComponent, ObjetivoSearchComponent],
  templateUrl: './ordenes-venta-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdenesVentaFormComponent {

  // Fila seleccionada en la grilla de órdenes de venta (/api/orden-venta/list-ordenes)
  readonly orden = input<any | null>(null);

  // 'consulta' | 'modificacion' | 'alta'
  readonly modo = input<string>('consulta');

  // Modificación guardada: el contenedor refresca la grilla y vuelve al listado
  readonly onAddorUpdate = output<any>();

  private apiService = inject(ApiService);
  private searchService = inject(SearchService);

  // En consulta el formulario es solo lectura
  readonly soloLectura = computed(() => this.modo() === 'consulta');

  // En alta no hay orden seleccionada: el formulario arranca vacío y el período se carga a mano
  readonly esAlta = computed(() => this.modo() === 'alta');

 readonly fechaTexto = computed(() => {
    const [anio, mes, dia] = texto(this.orden()?.Fecha).split('-');
    return dia ? `${dia}/${mes}/${anio}` : '';
  });

  readonly estados = toSignal(this.searchService.getEstadosOrdenVenta(), { initialValue: [] as any[] });

  // Se rearma al cambiar la orden seleccionada o el modo
  private readonly modelo = linkedSignal<{ modo: string; orden: any | null }, OrdenVentaCabeceraFormModel>({
    source: () => ({ modo: this.modo(), orden: this.orden() }),
    computation: ({ modo, orden }) => ({
      NroOrdenVenta: numero(orden?.NroOrdenVenta),
      // Solo el alta edita la fecha, y arranca en el día. Fuera del alta la muestra fechaTexto.
      Fecha: modo === 'alta' ? new Date() : null,
      ClienteId: numero(orden?.ClienteId),
      ObjetivoId: numero(orden?.ObjetivoId),
      EstadoOrdenVentaCodigo: texto(orden?.EstadoOrdenVentaCodigo),
      // En el alta no hay orden: el campo tiene que arrancar en null, nunca en undefined, o el
      // formulario se queda sin el nodo que usa [formField] en el template
      ImporteTotalAFacturar: orden?.ImporteTotalAFacturar ?? null
    })
  });

  readonly formOrdenVenta = form(this.modelo, p => {
    // En consulta no se edita ningún campo
    disabled(p, () => this.soloLectura());

    // El número de orden identifica a la orden: lo asigna el backend y no se edita en ningún modo
    disabled(p.NroOrdenVenta);

    // La fecha se carga en el alta; después es el rastro de auditoría del alta y no se toca
    disabled(p.Fecha, () => !this.esAlta());
    required(p.Fecha, { message: 'La fecha es obligatoria' });

    required(p.ClienteId, { message: 'El cliente es obligatorio' });
    required(p.ObjetivoId, { message: 'El objetivo es obligatorio' });
    required(p.EstadoOrdenVentaCodigo, { message: 'El estado es obligatorio' });

    // Que sea numérico y no negativo lo valida el backend, que es el que deshace la máscara
    required(p.ImporteTotalAFacturar, { message: 'El importe total es obligatorio' });
  });

  private readonly resetAlCargar = effect(() => {
    this.orden();
    this.modo();
    setTimeout(() => this.formOrdenVenta().reset(), 400);
  });

  // Último cliente que emitió el buscador. undefined = todavía no emitió ninguno.
  private clienteVisto: number | null | undefined = undefined;

  onClienteChange(extendido: any): void {
    const clienteId = numero(extendido?.ClienteId);
    const esCarga = this.clienteVisto === undefined;
    const cambioCliente = clienteId !== this.clienteVisto;

    this.clienteVisto = clienteId;

    if (this.soloLectura() || esCarga || !cambioCliente) return;

    this.modelo.update(modelo => ({ ...modelo, ObjetivoId: null }));
  }

  async guardar(): Promise<void> {
    if (this.soloLectura()) return;

    await submit(this.formOrdenVenta, async f => {
      const modelo = f().value();

      // De la fecha del alta salen AudFechaIng y el período; en la modificación los fija la orden
      const res = await firstValueFrom(
        this.esAlta()
          ? this.apiService.insertOrdenVenta({
            Fecha: modelo.Fecha,
            ClienteId: modelo.ClienteId,
            ObjetivoId: modelo.ObjetivoId,
            EstadoOrdenVentaCodigo: modelo.EstadoOrdenVentaCodigo,
            ImporteTotalAFacturar: modelo.ImporteTotalAFacturar
          })
          : this.apiService.updateCabeceraOrdenVenta({
            NroOrdenVenta: modelo.NroOrdenVenta,
            ClienteId: modelo.ClienteId,
            ObjetivoId: modelo.ObjetivoId,
            EstadoOrdenVentaCodigo: modelo.EstadoOrdenVentaCodigo,
            ImporteTotalAFacturar: modelo.ImporteTotalAFacturar
          }));

      if (!res?.data) return;
      this.onAddorUpdate.emit(res.data);
    });
  }
}
