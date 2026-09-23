import { Injectable, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { take } from 'rxjs';
import { MsgApi, MsgApiModalComponent, MsgApiModalData } from './msg-api-modal.component';

/**
 * Muestra el detalle de las llamadas a APIs externas que el back informa en `data.msgapi`.
 * Lo abre el interceptor para cualquier respuesta que lo traiga, así que ningún módulo
 * tiene que armar su propio modal.
 */
@Injectable({ providedIn: 'root' })
export class MsgApiModalService {
  private readonly modal = inject(NzModalService);

  /** Devuelve la lista de llamadas si el body trae un msgapi con algo para mostrar. */
  static llamadas(body: any): MsgApi[] | null {
    const msgapi = body?.data?.msgapi;
    if (msgapi == null || msgapi === '') return null;
    const llamadas = Array.isArray(msgapi) ? msgapi : [msgapi];
    return llamadas.length ? llamadas : null;
  }

  /** true si alguna llamada no terminó con un 2xx (o no llegó a responder). */
  static conError(llamadas: MsgApi[] | null): boolean {
    return !!llamadas?.some(l => !(l.status && l.status >= 200 && l.status < 300));
  }

  mostrar(mensaje: unknown, tipo: MsgApiModalData['tipo'], llamadas: MsgApi[]) {
    // Una respuesta exitosa que informa llamadas fallidas (un proceso por lotes) se muestra como advertencia
    const data: MsgApiModalData = {
      mensaje: Array.isArray(mensaje) ? mensaje.join(' ') : String(mensaje ?? ''),
      tipo: tipo === 'success' && MsgApiModalService.conError(llamadas) ? 'warning' : tipo,
      llamadas,
    };

    // Si hay otro modal abierto (una confirmación que todavía espera la respuesta) se abre
    // recién cuando se cerró: superpuestos, el de arriba queda bloqueado por el overlay del
    // de abajo y no se puede cerrar. El setTimeout espera a que el overlay se libere.
    if (this.modal.openModals.length) {
      this.modal.afterAllClose.pipe(take(1)).subscribe(() => setTimeout(() => this.abrir(data)));
      return;
    }
    this.abrir(data);
  }

  private abrir(data: MsgApiModalData) {
    const ref = this.modal.create<MsgApiModalComponent, MsgApiModalData>({
      nzTitle: data.tipo === 'error' ? 'Error en la llamada a la API' : 'Respuesta de la API',
      nzContent: MsgApiModalComponent,
      nzData: data,
      nzCentered: true,
      nzWidth: 'min(900px, calc(100vw - 32px))',
      nzBodyStyle: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' },
      nzFooter: [{ label: 'Cerrar', type: 'primary', onClick: () => ref.close() }],
    });
  }
}
