import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
}

export interface MsgApiModalData {
  /** El msg del envelope. */
  mensaje: string;
  tipo: 'success' | 'warning' | 'error';
  llamadas: MsgApi[];
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

  esOk(llamada: MsgApi) {
    return !!llamada.status && llamada.status >= 200 && llamada.status < 300;
  }
}
