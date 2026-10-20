import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SHARED_IMPORTS } from '../shared-imports';

/**
 * Una llamada a una API externa, tal como la informa el back en `data.msgapi`.
 * Todos los campos son opcionales: se muestra lo que venga.
 */
export interface MsgApi {
  /** Qué se consultó (una persona, una referencia de pago, …) cuando son varias llamadas. */
  titulo?: string;
  method?: string;
  /** Ruta completa del endpoint. */
  url?: string;
  /** Código HTTP que devolvió la API; 0 si no llegó a responder. */
  status?: number;
  /** Body tal cual se envió. */
  request?: unknown;
  /** Respuesta cruda de la API. */
  respuesta?: unknown;
  headers?: unknown;
  /**
   * Descripción corta del error, para la columna y el filtro de la tabla. Si no viene se arma con
   * el status. Hace falta cuando el error fue antes de llamar (por ejemplo, sin CUIT).
   */
  error?: string;
}

export interface MsgApiModalData {
  /** El msg del envelope. */
  mensaje: string;
  tipo: 'success' | 'warning' | 'error';
  llamadas: MsgApi[];
}

/** Hasta esta cantidad de llamadas se muestra una card por llamada; con más, una tabla. */
const MAXIMO_TARJETAS = 3;

export function esOkMsgApi(llamada: MsgApi): boolean {
  return !!llamada.status && llamada.status >= 200 && llamada.status < 300;
}


@Component({
  selector: 'app-msg-api-modal',
  imports: [SHARED_IMPORTS, JsonPipe],
  templateUrl: './msg-api-modal.component.html',
  styleUrls: ['./msg-api-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MsgApiModalComponent {
  readonly data = inject<MsgApiModalData>(NZ_MODAL_DATA);

  /** El msg no se repite en la alerta cuando es solo el "METHOD url" que ya muestra la card. */
  readonly mostrarMensaje =
    !!this.data.mensaje &&
    !this.data.llamadas.some(l => l.url && `${l.method ?? ''} ${l.url}`.trim() === this.data.mensaje.trim());

  readonly modoTabla = this.data.llamadas.length > MAXIMO_TARJETAS;

  /** Filas de la tabla: cada llamada con su índice (para expandir) y la descripción del error. */
  readonly filas = this.data.llamadas.map((llamada, indice) => ({ ...llamada, indice, error: this.descripcionError(llamada) }));

  /** Una opción de filtro por cada error distinto, con la cantidad de llamadas que lo tienen. */
  readonly filtrosError = [...new Set(this.filas.map(f => f.error))].map(error => ({
    text: `${error} (${this.filas.filter(f => f.error === error).length})`,
    value: error,
  }));

  /** Índices de las filas abiertas. */
  readonly expandidos = signal<Set<number>>(new Set());

  readonly filtrarPorError = (errores: string[], fila: MsgApi) => errores.includes(fila.error ?? '');
  readonly ordenarPorTitulo = (a: MsgApi, b: MsgApi) => (a.titulo ?? '').localeCompare(b.titulo ?? '');

  esOk(llamada: MsgApi) {
    return esOkMsgApi(llamada);
  }

  alternar(indice: number, abierto: boolean) {
    this.expandidos.update(actual => {
      const nuevo = new Set(actual);
      if (abierto) nuevo.add(indice);
      else nuevo.delete(indice);
      return nuevo;
    });
  }

  private descripcionError(llamada: MsgApi): string {
    if (llamada.error) return llamada.error;
    if (esOkMsgApi(llamada)) return 'Sin error';
    return llamada.status ? `HTTP ${llamada.status}` : 'Sin respuesta';
  }
}
