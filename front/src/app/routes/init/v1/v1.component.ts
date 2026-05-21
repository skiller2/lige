import { Platform } from '@angular/cdk/platform';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  DOCUMENT,
  resource
} from '@angular/core';
import type { Chart } from '@antv/g2';
import { SHARED_IMPORTS } from '@shared';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { G2BarComponent, G2BarModule } from '@delon/chart/bar';
import { G2PieModule } from '@delon/chart/pie';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { G2TimelineModule } from '@delon/chart/timeline';
import { G2CustomModule } from '@delon/chart/custom';
import { DA_SERVICE_TOKEN } from '@delon/auth';

@Component({
  selector: 'app-init-v1',
  templateUrl: './v1.component.html',
  styleUrl: './v1.component.less',
  imports: [...SHARED_IMPORTS, CommonModule, G2TimelineModule, G2BarModule, G2MiniBarModule, G2PieModule, G2CustomModule],
  encapsulation: ViewEncapsulation.None
})
export class InitV1Component implements OnInit {
  private readonly ngZone = inject(NgZone);
  private stmactual: Date = new Date();
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private platform = inject(Platform)
  @ViewChild("g2horas") g2horas!: G2BarComponent;
  private doc = inject(DOCUMENT);

  render(el: ElementRef<HTMLDivElement>): void {
    this.ngZone.runOutsideAngular(() => this.init(el.nativeElement));
  }

  private async init(el: HTMLElement): Promise<void> {
    const data = await this.horasTrabajadas.value()
    const chart: Chart = new (window as NzSafeAny).G2.Chart({
      container: el,
      autoFit: true,
    });

    chart.data(data.data.horasTrabajadas);
    chart.scale('y', {
      alias: 'horas'
    });

    chart.axis('x', {
      //      tickLine: null,
    });

    chart.axis('y', {
      label: {
        formatter: text => {
          return text.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
        }
      },
    });

    chart.legend({
      position: 'right',
    });

    chart.tooltip({
      shared: true,
      showMarkers: false,
    });
    chart.interaction('active-region');

    chart
      .interval()
      .adjust('stack')
      .position('x*y')
      .color('type');

    chart.render();
  }

  ngOnInit(): void {
    queueMicrotask(() => this.genOnboarding());
  }

  fixDark(chart: Chart): void {
    if (
      !this.platform.isBrowser ||
      (this.doc.body as HTMLBodyElement).getAttribute('data-theme') !== 'dark'
    )
      return;

    chart.theme({
      styleSheet: {
        backgroundColor: 'transparent',
      },
    });
  }


  private genOnboarding(): void {
    const KEY = 'on-boarding';
    if (!this.platform.isBrowser || localStorage.getItem(KEY) === '1') {
      return;
    }
    /*
    this.http
      .get(`./assets/tmp/on-boarding.json`)
      .subscribe((res: OnboardingConfig) => {
        this.obSrv.start(res);
        localStorage.setItem(KEY, '1');
      });
      */
  }

  private readonly token = this.tokenService.get()?.token ?? ''

  public adelantosPendientes = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/adelantospendientes', { headers: { token: this.token } })
      return await ds.json()
    }
  });

  public excepcionesPendientes = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/excepcionespendientes', { headers: { token: this.token } })
      return await ds.json()
    }
  });

  public clientesActivos = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/clientesactivos', { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public objetivosActivos = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/objetivosactivos', { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public cambioCategoriaPendientes = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/cambioscategoria', { headers: { token: this.token } })
      return await ds.json()

    }
  });


  public objetivosSinGrupo = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/objetivossingrupo', { headers: { token: this.token } })
      return await ds.json()

    }
  });


  public recibosPendientes = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch(`/api/init/stats/recibos`, { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public personasActivasSinHabilitaciones = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/personasactivassinhabilitacion', { headers: { token: this.token } })
      return await ds.json()

    }
  });


  public objetivosActivosSinHabilitaciones = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/objetivosactivossinhabilitacion', { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public habilitacionesProximaVencer = resource({
    params: () => null,
    loader: async () => {
      const ds = await fetch('/api/init/stats/habilitacionesproximavencer', { headers: { token: this.token } })
      return await ds.json()

    }
  });


  public objetivosSinAsistencia = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();

      const ds = await fetch(`/api/init/stats/objetivossinasistencia/${anio}/${mes}`, { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public objetivosSinAsistenciaCur = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();
      const ds = await fetch(`/api/init/stats/objetivossinasistencia/${anio}/${mes}`, { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public licenciasInconsistentes = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();

      const ds = await fetch(`/api/init/stats/licenciasinconsistentes/${anio}/${mes}`, { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public custodiasPendientes = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();


      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();
      const ds = await fetch(`/api/init/stats/custodiaspendientes/${anio}/${mes}`, { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public custodiasPendientesCur = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      //stmactual.setMonth(stmactual.getMonth() - 1)
      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();
      const ds = await fetch(`/api/init/stats/custodiaspendientes/${anio}/${mes}`, { headers: { token: this.token } })
      return await ds.json()

    }
  });

  public horasTrabajadas = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      const anio = stmactual.getFullYear();
      const ds = await fetch(`/api/init/stats/horastrabajadas/${anio}`, { headers: { token: this.token } })
      return await ds.json()
    }
  });

}
