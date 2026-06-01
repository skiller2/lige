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
import { ApiService } from '../../../services/api.service';

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
  private platform = inject(Platform)
  @ViewChild("g2horas") g2horas!: G2BarComponent;
  private doc = inject(DOCUMENT);
  private apiService = inject(ApiService)
  render(el: ElementRef<HTMLDivElement>): void {
    this.ngZone.runOutsideAngular(() => this.init(el.nativeElement));
  }


  private chart?: Chart;

  private async init(el: HTMLElement) {
    const data = await this.horasTrabajadas.value();

    if (!this.chart) {
      this.chart = new (window as NzSafeAny).G2.Chart({
        container: el,
        autoFit: true
      });
    }

    const chart = this.chart;
    if (chart) {
      chart.clear(); // ✅ evita recrear

      chart.data(data.data.horasTrabajadas);

      chart.interval()
        .adjust('stack')
        .position('x*y')
        .color('type');

      chart.render();

      this.fixDark(chart);
    }
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


  public adelantosPendientes = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/adelantospendientes')
    }
  
  });

  public excepcionesPendientes = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/excepcionespendientes')
    }
  });

  public clientesActivos = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/clientesactivos')
    }
  });

  public objetivosActivos = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/objetivosactivos')

    }
  });

  public cambioCategoriaPendientes = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/cambioscategoria')

    }
  });


  public objetivosSinGrupo = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/objetivossingrupo')

    }
  });


  public recibosPendientes = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch(`api/init/stats/recibos`)

    }
  });

  public personasActivasSinHabilitaciones = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/personasactivassinhabilitacion')

    }
  });


  public objetivosActivosSinHabilitaciones = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/objetivosactivossinhabilitacion')

    }
  });

  public habilitacionesProximaVencer = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/habilitacionesproximavencer')

    }
  });


  public objetivosSinAsistencia = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();

      return <any> await this.apiService.fastFetch(`api/init/stats/objetivossinasistencia/${anio}/${mes}`)

    }
  });

  public reaperturasAsistencia = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();

      return <any> await this.apiService.fastFetch(`api/init/stats/reaperturasasistencia/${anio}/${mes}`)
    }
  });

  public objetivosSinAsistenciaCur = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();
      return <any> await this.apiService.fastFetch(`api/init/stats/objetivossinasistencia/${anio}/${mes}`)

    }
  });

  public licenciasInconsistentes = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();

      return <any> await this.apiService.fastFetch(`api/init/stats/licenciasinconsistentes/${anio}/${mes}`)

    }
  });

  public custodiasPendientes = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();


      stmactual.setMonth(stmactual.getMonth() - 1)

      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();
      return <any> await this.apiService.fastFetch(`api/init/stats/custodiaspendientes/${anio}/${mes}`)

    }
  });

  public custodiasPendientesCur = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      //stmactual.setMonth(stmactual.getMonth() - 1)
      const mes = stmactual.getMonth() + 1;
      const anio = stmactual.getFullYear();
      return <any> await this.apiService.fastFetch(`api/init/stats/custodiaspendientes/${anio}/${mes}`)

    }
  });

  public custodiasLiquidadas = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/custodiasliquidadas')
    }
  });

  public horasTrabajadasCustodias = resource({
    params: () => null,
    loader: async () => {
      return <any> await this.apiService.fastFetch('api/init/stats/horastrabajadascustodias')
    }
  });

  public horasTrabajadas = resource({
    params: () => null,
    loader: async () => {
      const stmactual = new Date();
      const anio = stmactual.getFullYear();
      return <any> await this.apiService.fastFetch(`api/init/stats/horastrabajadas/${anio}`)
    }
  });

}
