import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SHARED_IMPORTS } from '@shared';
import { MsgApi } from '../../../../shared/msg-api-modal/msg-api-modal.component';

/**
 * Un pendiente que no se pudo obtener, tal como lo devuelve el back en `fallidos`.
 * Hereda de MsgApi el detalle de la llamada al banco (method, url, status, request, respuesta),
 * que falta cuando el error fue antes de llamar (por ejemplo, sin CUIT).
 */
export interface FallidoPendiente extends MsgApi {
  PersonalId: number;
  persona: string;
  CUIT: string;
  /** Descripción corta del error, para la columna y el filtro. */
  error: string;
}

export interface ComprobantesPendientesErroresData {
  /** Resumen de todo el proceso (todos los chunks). */
  mensaje: string;
  fallidos: FallidoPendiente[];
}

/**
 * Tabla de errores de "Obtener comprobantes pendientes del período".
 *
 * Se usa solo en ese proceso: como puede haber muchos fallidos, en lugar de una card por llamada
 * (el modal de APIs externas) muestra una fila por persona, con filtro por tipo de error, y el
 * request/respuesta del banco al expandir la fila.
 */
@Component({
  selector: 'app-comprobantes-pendientes-errores',
  imports: [SHARED_IMPORTS, JsonPipe],
  templateUrl: './comprobantes-pendientes-errores.component.html',
  styleUrls: ['./comprobantes-pendientes-errores.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprobantesPendientesErroresComponent {
  readonly data = inject<ComprobantesPendientesErroresData>(NZ_MODAL_DATA);

  /** PersonalId de las filas abiertas. */
  readonly expandidos = signal<Set<number>>(new Set());

  /** Una opción de filtro por cada error distinto, con la cantidad de personas que lo tienen. */
  readonly filtrosError = [...new Set(this.data.fallidos.map(f => f.error))].map(error => ({
    text: `${error} (${this.data.fallidos.filter(f => f.error === error).length})`,
    value: error,
  }));

  readonly filtrarPorError = (errores: string[], fila: FallidoPendiente) => errores.includes(fila.error);
  readonly ordenarPorPersona = (a: FallidoPendiente, b: FallidoPendiente) => a.persona.localeCompare(b.persona);

  alternar(PersonalId: number, abierto: boolean) {
    this.expandidos.update(actual => {
      const nuevo = new Set(actual);
      if (abierto) nuevo.add(PersonalId);
      else nuevo.delete(PersonalId);
      return nuevo;
    });
  }

  esOk(fila: FallidoPendiente) {
    return !!fila.status && fila.status >= 200 && fila.status < 300;
  }
}
