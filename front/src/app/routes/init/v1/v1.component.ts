import { Platform } from '@angular/cdk/platform';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import type { Chart } from '@antv/g2';
//import { OnboardingConfig, OnboardingService } from '@delon/abc/onboarding';
import { _HttpClient } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  firstValueFrom,
  share,
  switchMap,
} from 'rxjs';
import { G2BarComponent, G2BarModule } from '@delon/chart/bar';
import { G2PieModule } from '@delon/chart/pie';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { G2TimelineModule } from '@delon/chart/timeline';
import { G2CustomModule } from '@delon/chart/custom';

@Component({
  selector: 'app-init-v1',
  templateUrl: './v1.component.html',
  styleUrl: './v1.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [...SHARED_IMPORTS, CommonModule, G2TimelineModule, G2BarModule, G2MiniBarModule, G2PieModule, G2CustomModule],
  encapsulation: ViewEncapsulation.None
})
export class InitV1Component implements OnInit {
  private readonly ngZone = inject(NgZone);

  @ViewChild("g2horas") g2horas!: G2BarComponent;
  render(el: ElementRef<HTMLDivElement>): void {
    this.ngZone.runOutsideAngular(() => this.init(el.nativeElement));
  }

  private async init(el: HTMLElement): Promise<void> {
    const data = await firstValueFrom(this.horasTrabajadas$)
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

  adelantosPendientes$ = this.http.get('/api/init/stats/adelantospendientes');
  excepcionesPendientes$ = this.http.get(
    '/api/init/stats/excepcionespendientes'
  );
  clientesActivos$ = this.http
    .get('/api/init/stats/clientesactivos')
    .pipe(share());
  objetivosActivos$ = this.http
    .get('/api/init/stats/objetivosactivos')
    .pipe(share());
  cambioCategoriaPendientes$ = this.http
    .get('/api/init/stats/cambioscategoria')
    .pipe(share());

  objetivosSinGrupo$ = this.http
    .get('/api/init/stats/objetivossingrupo')
    .pipe(share());

  horasTrabajadas$ = this.statshorastrabajadas();
  objetivosSinAsistencia$ = this.statssinAsistencia();
  objetivosSinAsistenciaCur$ = this.statssinAsistenciaCur();
  licenciasInconsistentes$ = this.statsLicenciasInconsistentes()

  webSite!: any[];
  salesData!: any[];
  offlineChartData!: any[];

  constructor(
    private http: _HttpClient,
    private cdr: ChangeDetectorRef,
    //    private obSrv: OnboardingService,
    private platform: Platform,
    @Inject(DOCUMENT) private doc: NzSafeAny
  ) {
    // TODO: Wait for the page to load
    setTimeout(() => this.genOnboarding(), 1000);
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

  statshorastrabajadas(): Observable<any> {
    const stmactual = new Date();
    const anio = stmactual.getFullYear();
    return this.http.get(`/api/init/stats/horastrabajadas/${anio}`);
  }

  statssinAsistencia(): Observable<any> {
    const stmactual = new Date();
    stmactual.setMonth(stmactual.getMonth() - 1)

    const mes = stmactual.getMonth() + 1;
    const anio = stmactual.getFullYear();

    return this.http.get(
      `/api/init/stats/objetivossinasistencia/${anio}/${mes}`
    );
  }


  statsLicenciasInconsistentes(): Observable<any> {
    const stmactual = new Date();
    stmactual.setMonth(stmactual.getMonth() - 1)

    const mes = stmactual.getMonth() + 1;
    const anio = stmactual.getFullYear();

    return this.http.get(
      `/api/init/stats/licenciasinconsistentes/${anio}/${mes}`
    );
  }


  statssinAsistenciaCur(): Observable<any> {
    const stmactual = new Date();
    const mes = stmactual.getMonth() + 1;
    const anio = stmactual.getFullYear();
    return this.http.get(
      `/api/init/stats/objetivossinasistencia/${anio}/${mes}`
    );
  }


  ngOnInit(): void {

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
}
