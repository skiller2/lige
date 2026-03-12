import { ChangeDetectionStrategy, Component, inject, signal, computed, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom, timer } from 'rxjs';
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
      <nz-spin [nzSpinning]="avisos.isLoading()" [nzDelay]="0">
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
                <div class="notice-icon__clear" (click)="marcaTodoVisto()">Marcar como leidos</div>
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
                <div class="notice-icon__clear" (click)="marcaTodoVisto()">Marcar como leidos</div>
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
export class AvisoNotifyComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  delayShow = signal(false);

  private readonly tick = toSignal(timer(0, 60000), { initialValue: -1 });

  readonly avisos = resource({
    params: () => this.tick(),
    loader: async () => {
      const avisos = await firstValueFrom(this.apiService.getAvisos());
      return avisos as Aviso[];
    },
  });

  avisosGenerales = computed(() => (this.avisos.value() ?? []).filter(a => a.Grupo !== 'gSistemas'));
  avisosProcesos = computed(() => (this.avisos.value() ?? []).filter(a => a.Grupo === 'gSistemas'));
  count = computed(() => (this.avisos.value() ?? []).filter(a => !a.FechaVisualizacion).length);

  getConfig(aviso: Aviso) {
    return CLASE_CONFIG[aviso.ClaseMensaje] ?? CLASE_CONFIG['INF'];
  }

  onVisibleChange(visible: boolean): void {
    this.delayShow.set(visible);
    if (visible) this.avisos.reload();
  }

  async onSelect(aviso: Aviso): Promise<void> {
    if (!aviso.FechaVisualizacion) {
      await firstValueFrom(this.apiService.marcarAvisoVisto(aviso.AvisoId));
      this.avisos.update(list => (list ?? []).map(a =>
        a.AvisoId === aviso.AvisoId ? { ...a, FechaVisualizacion: new Date().toISOString() } : a
      ));
    }

    if (aviso.EnlaceUrl) {
      this.router.navigateByUrl(aviso.EnlaceUrl);
    }
  }

  async onOcultar(aviso: Aviso, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await firstValueFrom(this.apiService.ocultarAviso(aviso.AvisoId));
    this.avisos.update(list => (list ?? []).filter(a => a.AvisoId !== aviso.AvisoId));
  }

  async marcaTodoVisto(): Promise<void> {
    await firstValueFrom(this.apiService.marcarTodosAvisosVistos());
    this.avisos.update(list => (list ?? []).map(a => ({ ...a, FechaVisualizacion: a.FechaVisualizacion ?? new Date().toISOString() })));
  }
}
