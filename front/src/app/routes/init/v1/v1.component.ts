import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Inject, OnInit, Renderer2 } from '@angular/core';
import type { Chart } from '@antv/g2';
import { OnboardingConfig, OnboardingService } from '@delon/abc/onboarding';
import { _HttpClient } from '@delon/theme';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { BehaviorSubject, Observable, debounceTime, share, switchMap } from 'rxjs';

@Component({
  selector: 'app-init-v1',
  templateUrl: './v1.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitV1Component implements OnInit {

  @HostListener('document:visibilitychange', ['$event'])
  visibilitychange() {
    if (document.hidden) {
      //            console.log("Page is hidden");
    } else {
      this.triggerVisibilityChange$.next(1)

    }
  }


  @HostListener('window:focus', ['$event'])
  onfocus() {
    this.triggerVisibilityChange$.next(1)

  }



  triggerVisibilityChange$ = new BehaviorSubject(0)

  adelantosPendientes$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.http.get('/api/init/stats/adelantospendientes')),
  )
  excepcionesPendientes$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.http.get('/api/init/stats/excepcionespendientes')),
  )

  clientesActivos$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.http.get('/api/init/stats/clientesactivos')),
    share()
  )

  objetivosActivos$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.http.get('/api/init/stats/objetivosactivos')),
    share()
  )

  horasTrabajadas$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.statshorastrabajadas()),
  )

  objetivosSinAsistencia$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.statssinAsistencia()),
  )

  objetivosSinAsistenciaCur$ = this.triggerVisibilityChange$.pipe(
    debounceTime(500),
    switchMap(() => this.statssinAsistenciaCur()),
  )

  webSite!: any[];
  salesData!: any[];
  offlineChartData!: any[];

  constructor(
    private http: _HttpClient,
    private cdr: ChangeDetectorRef,
    private obSrv: OnboardingService,
    private platform: Platform,
    @Inject(DOCUMENT) private doc: NzSafeAny
  ) {
    // TODO: Wait for the page to load
    setTimeout(() => this.genOnboarding(), 1000);
  }

  fixDark(chart: Chart): void {
    if (!this.platform.isBrowser || (this.doc.body as HTMLBodyElement).getAttribute('data-theme') !== 'dark') return;

    chart.theme({
      styleSheet: {
        backgroundColor: 'transparent'
      }
    });
  }



  statshorastrabajadas(): Observable<any> {
    const stmactual = new Date()
    const anio = stmactual.getFullYear()
    return this.http.get(`/api/init/stats/horastrabajadas/${anio}`)
  }

  statssinAsistencia(): Observable<any> {
    const stmactual = new Date()
    const mes = stmactual.getMonth()
    const anio = stmactual.getFullYear()

    return this.http.get(`/api/init/stats/objetivossinasistencia/${anio}/${mes}`)
  }

  statssinAsistenciaCur(): Observable<any> {
    const stmactual = new Date()
    const mes = stmactual.getMonth() + 1
    const anio = stmactual.getFullYear()
    return this.http.get(`/api/init/stats/objetivossinasistencia/${anio}/${mes}`)
  }

  ngOnInit(): void {
    this.triggerVisibilityChange$.next(1)

    //https://github.com/Hopding/pdf-lib/issues/296   para pdf 

  }

  private genOnboarding(): void {
    const KEY = 'on-boarding';
    if (!this.platform.isBrowser || localStorage.getItem(KEY) === '1') {
      return;
    }
    this.http.get(`./assets/tmp/on-boarding.json`).subscribe((res: OnboardingConfig) => {
      this.obSrv.start(res);
      localStorage.setItem(KEY, '1');
    });
  }
}
