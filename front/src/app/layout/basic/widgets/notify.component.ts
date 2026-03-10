import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { DatePipe } from '@angular/common';

interface Aviso {
  AvisoId: number;
  Usuario: string;
  Grupo: string | null;
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
    <div nz-dropdown [nzDropdownMenu]="notifyMenu" nzTrigger="click" nzPlacement="bottomRight"
         [nzOverlayClassName]="'header-dropdown notice-icon notice-icon__tab-left'"
         (nzVisibleChange)="onVisibleChange($event)">
      <nz-badge [nzCount]="count()" class="alain-default__nav-item" [nzStyle]="{ 'box-shadow': 'none' }">
        <nz-icon nzType="bell" class="alain-default__nav-item-icon" />
      </nz-badge>
    </div>
    <nz-dropdown-menu #notifyMenu="nzDropdownMenu">
      <nz-spin [nzSpinning]="loading()" [nzDelay]="0">
        @if (delayShow()) {
          <nz-tabs [nzSelectedIndex]="0" [nzCentered]="false">
            <nz-tab nzTitle="Avisos">
              @if (avisosGenerales().length > 0) {
                <nz-list [nzDataSource]="avisosGenerales()" [nzRenderItem]="avisoItem">
                  <ng-template #avisoItem let-item>
                    <nz-list-item [class.notice-icon__item-read]="!!item.FechaVisualizacion" (click)="onSelect(item)">
                      <nz-list-item-meta [nzTitle]="avisoTitle" [nzDescription]="avisoDesc">
                        <ng-template #avisoTitle>
                          <span>{{ item.TextoMensaje }}</span>
                          <div class="notice-icon__item-extra">
                            <nz-tag [nzColor]="getConfig(item).color">{{ item.ClaseMensaje }}</nz-tag>
                          </div>
                        </ng-template>
                        <ng-template #avisoDesc>
                          <div class="notice-icon__item-time">{{ item.AudFechaIng | date:'dd/MM/yyyy HH:mm' }}</div>
                        </ng-template>
                      </nz-list-item-meta>
                      <ul nz-list-item-actions>
                        <nz-list-item-action>
                          <button nz-tooltip nzTooltipTitle="Ocultar aviso" style="border:none;background:none;cursor:pointer;color:#999;font-size:14px;padding:4px;"
                                  (click)="onOcultar(item, $event)">
                            <nz-icon nzType="close" />
                          </button>
                        </nz-list-item-action>
                      </ul>
                    </nz-list-item>
                  </ng-template>
                </nz-list>
                <div class="notice-icon__clear" (click)="clearAll()">Marcar como leidos</div>
              } @else {
                <div class="notice-icon__notfound">
                  <img class="notice-icon__notfound-img" src="https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg" alt="not found" />
                  <p>No hay avisos</p>
                </div>
              }
            </nz-tab>
            <nz-tab nzTitle="Procesos">
              @if (avisosProcesos().length > 0) {
                <nz-list [nzDataSource]="avisosProcesos()" [nzRenderItem]="procesoItem">
                  <ng-template #procesoItem let-item>
                    <nz-list-item [class.notice-icon__item-read]="!!item.FechaVisualizacion" (click)="onSelect(item)">
                      <nz-list-item-meta [nzTitle]="procesoTitle" [nzDescription]="procesoDesc">
                        <ng-template #procesoTitle>
                          <span>{{ item.TextoMensaje }}</span>
                          <div class="notice-icon__item-extra">
                            <nz-tag [nzColor]="getConfig(item).color">{{ item.ClaseMensaje }}</nz-tag>
                          </div>
                        </ng-template>
                        <ng-template #procesoDesc>
                          <div class="notice-icon__item-time">{{ item.AudFechaIng | date:'dd/MM/yyyy HH:mm' }}</div>
                        </ng-template>
                      </nz-list-item-meta>
                      <ul nz-list-item-actions>
                        <nz-list-item-action>
                          <button nz-tooltip nzTooltipTitle="Ocultar aviso" style="border:none;background:none;cursor:pointer;color:#999;font-size:14px;padding:4px;"
                                  (click)="onOcultar(item, $event)">
                            <nz-icon nzType="close" />
                          </button>
                        </nz-list-item-action>
                      </ul>
                    </nz-list-item>
                  </ng-template>
                </nz-list>
                <div class="notice-icon__clear" (click)="clearAll()">Marcar como leidos</div>
              } @else {
                <div class="notice-icon__notfound">
                  <img class="notice-icon__notfound-img" src="https://gw.alipayobjects.com/zos/rmsportal/wAhyIChODzsoKIOBHcBk.svg" alt="not found" />
                  <p>No hay procesos</p>
                </div>
              }
            </nz-tab>
          </nz-tabs>
        }
      </nz-spin>
    </nz-dropdown-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzBadgeModule, NzIconModule, NzDropDownModule, NzSpinModule, NzTabsModule, NzListModule, NzTagModule, NzTooltipModule, DatePipe]
})
export class HeaderNotifyComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private avisos = signal<Aviso[]>([]);
  loading = signal(false);
  delayShow = signal(false);

  avisosGenerales = computed(() => this.avisos().filter(a => a.Grupo !== 'gSistemas'));
  avisosProcesos = computed(() => this.avisos().filter(a => a.Grupo === 'gSistemas'));

  count = computed(() => this.avisos().filter(a => !a.FechaVisualizacion).length);

  ngOnInit(): void {
    this.loadData();
    interval(60000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }

  getConfig(aviso: Aviso) {
    return CLASE_CONFIG[aviso.ClaseMensaje] ?? CLASE_CONFIG['INF'];
  }

  onVisibleChange(visible: boolean): void {
    this.delayShow.set(visible);
    if (visible) this.loadData();
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

  onSelect(aviso: Aviso): void {
    if (!aviso.FechaVisualizacion) {
      this.apiService.marcarAvisoVisto(aviso.AvisoId).subscribe(() => {
        this.avisos.update(list => list.map(a =>
          a.AvisoId === aviso.AvisoId ? { ...a, FechaVisualizacion: new Date().toISOString() } : a
        ));
        this.cdr.detectChanges();
      });
    }

    if (aviso.EnlaceUrl) {
      this.router.navigateByUrl(aviso.EnlaceUrl);
    }
  }

  onOcultar(aviso: Aviso, event: MouseEvent): void {
    event.stopPropagation();
    this.apiService.ocultarAviso(aviso.AvisoId).subscribe(() => {
      this.avisos.update(list => list.filter(a => a.AvisoId !== aviso.AvisoId));
      this.cdr.detectChanges();
    });
  }

  clearAll(): void {
    this.apiService.marcarTodosAvisosVistos().subscribe(() => {
      this.avisos.update(list => list.map(a => ({ ...a, FechaVisualizacion: a.FechaVisualizacion ?? new Date().toISOString() })));
      this.cdr.detectChanges();
    });
  }
}
