import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, Injector, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NoticeIconModule, NoticeIconSelect, NoticeItem } from '@delon/abc/notice-icon';
import { firstValueFrom, timer } from 'rxjs';
import { ApiService } from '../../../services/api.service';

interface Aviso {
  AvisoId: number;
  Usuario: string;
  ClaseMensaje: string;
  TextoMensaje: string;
  EnlaceUrl: string | null;
  FechaVisualizacion: string | null;
  AudFechaIng: string;
}

const CLASE_CONFIG: Record<string, { icon: string; color: string }> = {
  INF: { icon: 'info-circle', color: '#1890ff' },
  WRN: { icon: 'warning', color: '#faad14' },
  ERR: { icon: 'close-circle', color: '#f5222d' },
};

@Component({
  selector: 'header-notify',
  template: `
    <notice-icon
      [data]="data()"
      [count]="count()"
      [loading]="avisos.isLoading()"
      btnClass="alain-default__nav-item"
      btnIconClass="alain-default__nav-item-icon"
      (select)="select($event)"
      (clear)="marcaTodoVisto($event)"
      (popoverVisibleChange)="avisos.reload()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoticeIconModule]
})
export class HeaderNotifyComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  count = computed(() => (this.avisos.value() ?? []).filter(a => !a.FechaVisualizacion).length);
  data = computed<NoticeItem[]>(() => {
    const items = this.avisos.value() ?? [];

    return [
      {
        title: 'Avisos',
        list: items.map(a => {
          const cfg = CLASE_CONFIG[a.ClaseMensaje] ?? CLASE_CONFIG['INF'];
          return {
            id: a.AvisoId,
            title: a.TextoMensaje,
            description: '',
            datetime: new Date(a.AudFechaIng),
            read: !!a.FechaVisualizacion,
            color: cfg.color,
            extra: a.ClaseMensaje,
            status: a.ClaseMensaje === 'ERR' ? 'urgent' : a.ClaseMensaje === 'WRN' ? 'doing' : 'processing',
          };
        }),
        emptyText: 'No hay avisos',
        emptyImage: 'https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg',
        clearText: 'Marcar como leidos',
      }
    ];
  });

  private readonly tick = toSignal(timer(0, 60000), { initialValue: -1 });

  readonly avisos = resource({
    params: () => this.tick(), // <- reactive param
    loader: async () => {
      const avisos = await firstValueFrom(this.apiService.getAvisos());
      return avisos as Aviso[];
    },
  });

  async select(res: NoticeIconSelect): Promise<void> {
    const lista = this.avisos.value() ?? [];
    const aviso = lista.find(a => a.AvisoId === res.item['id']);
    if (!aviso) return;
    const result = await firstValueFrom(this.apiService.marcarAvisoVisto(aviso.AvisoId));
    this.avisos.update(list => (list ?? []).map(a =>
      a.AvisoId === aviso.AvisoId ? { ...a, FechaVisualizacion: new Date().toISOString() } : a
    ));

    if (aviso.EnlaceUrl) {
      this.router.navigateByUrl(aviso.EnlaceUrl);
    }
  }

  async marcaTodoVisto(_type: string): Promise<void> {

    const res = await firstValueFrom(this.apiService.marcarTodosAvisosVistos())
    this.avisos.update(list => (list ?? []).map(a => ({ ...a, FechaVisualizacion: a.FechaVisualizacion ?? new Date().toISOString() })));
  }
}
