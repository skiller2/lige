import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NoticeIconModule, NoticeIconSelect, NoticeItem } from '@delon/abc/notice-icon';
import { interval } from 'rxjs';
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
      [loading]="loading()"
      btnClass="alain-default__nav-item"
      btnIconClass="alain-default__nav-item-icon"
      (select)="select($event)"
      (clear)="clear($event)"
      (popoverVisibleChange)="loadData()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoticeIconModule]
})
export class HeaderNotifyComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private avisos = signal<Aviso[]>([]);
  loading = signal(false);

  count = computed(() => this.avisos().filter(a => !a.FechaVisualizacion).length);

  data = computed<NoticeItem[]>(() => {
    const items = this.avisos();
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

  ngOnInit(): void {
    this.loadData();
    interval(60000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }

  loadData(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.apiService.getAvisos().subscribe({
      next: (avisos: Aviso[]) => {
        this.avisos.set(avisos);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  select(res: NoticeIconSelect): void {
    const aviso = this.avisos().find(a => a.AvisoId === res.item['id']);
    if (!aviso) return;

    this.apiService.marcarAvisoVisto(aviso.AvisoId).subscribe(() => {
      this.avisos.update(list => list.map(a =>
        a.AvisoId === aviso.AvisoId ? { ...a, FechaVisualizacion: new Date().toISOString() } : a
      ));
      this.cdr.detectChanges();
    });

    if (aviso.EnlaceUrl) {
      this.router.navigateByUrl(aviso.EnlaceUrl);
    }
  }

  clear(_type: string): void {
    this.apiService.marcarTodosAvisosVistos().subscribe(() => {
      this.avisos.update(list => list.map(a => ({ ...a, FechaVisualizacion: a.FechaVisualizacion ?? new Date().toISOString() })));
      this.cdr.detectChanges();
    });
  }
}
