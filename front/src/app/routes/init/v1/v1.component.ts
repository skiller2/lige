import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Renderer2 } from '@angular/core';
import type { Chart } from '@antv/g2';
import { OnboardingConfig, OnboardingService } from '@delon/abc/onboarding';
import { _HttpClient } from '@delon/theme';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { Observable, share } from 'rxjs';

@Component({
  selector: 'app-init-v1',
  templateUrl: './v1.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitV1Component implements OnInit {
  
  
  adelantosPendientes$ = this.http.get('/api/init/stats/adelantospendientes')  
  excepcionesPendientes$ = this.http.get('/api/init/stats/excepcionespendientes')  
  clientesActivos$ = this.http.get('/api/init/stats/clientesactivos').pipe(share())
  objetivosActivos$ = this.http.get('/api/init/stats/objetivosactivos').pipe(share())
  horasTrabajadas$ = this.statshorastrabajadas()
  objetivosSinAsistencia$= this.statssinAsistencia()
  objetivosSinAsistenciaCur$ = this.statssinAsistenciaCur()
  
  
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
    const mes = stmactual.getMonth()+1    
    const anio = stmactual.getFullYear()    
    return this.http.get(`/api/init/stats/objetivossinasistencia/${anio}/${mes}`) 
  }



  ngOnInit(): void {
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
