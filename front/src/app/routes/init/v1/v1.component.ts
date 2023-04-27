import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Renderer2 } from '@angular/core';
import type { Chart } from '@antv/g2';
import { OnboardingConfig, OnboardingService } from '@delon/abc/onboarding';
import { _HttpClient } from '@delon/theme';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

@Component({
  selector: 'app-init-v1',
  templateUrl: './v1.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitV1Component implements OnInit {
  todoData = [
    {
      completed: true,
      avatar: '1',
      name: '苏先生',
      content: `请告诉我，我应该说点什么好？`
    },
    {
      completed: false,
      avatar: '2',
      name: 'はなさき',
      content: `ハルカソラトキヘダツヒカリ`
    },
    {
      completed: false,
      avatar: '3',
      name: 'cipchk',
      content: `this world was never meant for one as beautiful as you.`
    },
    {
      completed: false,
      avatar: '4',
      name: 'Kent',
      content: `my heart is beating with hers`
    },
    {
      completed: false,
      avatar: '5',
      name: 'Are you',
      content: `They always said that I love beautiful girl than my friends`
    },
    {
      completed: false,
      avatar: '6',
      name: 'Forever',
      content: `Walking through green fields ，sunshine in my eyes.`
    }
  ];

  horasTrabajadas = [{ x: '2023-02', y: 2 }]
  horasTrabajadasTitle = ""
  
  objetivosActivos = []
  objetivosActivosTitle = ""
  objetivosActivosTotal = 0

  clientesActivos = []
  clientesActivosTitle = ""
  clientesActivosTotal = 0


  objetivosSinAsistencia = []
  objetivosSinAsistenciaTitle = ""
  objetivosSinAsistenciaTotal = 0

  objetivosSinAsistenciaCur = []
  objetivosSinAsistenciaTitleCur = ""
  objetivosSinAsistenciaTotalCur = 0
  
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

  ngOnInit(): void {
    this.http.get('/api/init/stats').subscribe((res: { data: { horasTrabajadas: { x: string; y: number; }[]; }; }) => {
      this.horasTrabajadas = res.data.horasTrabajadas;
      this.horasTrabajadasTitle ="Año 2023"
//      this.webSite = res.visitData.slice(0, 10);
//      this.salesData = res.salesData;
//      this.offlineChartData = res.offlineChartData;
      this.cdr.detectChanges();
    });

    this.http.get('/api/init/stats/objetivosactivos').subscribe((res: { data: { objetivosActivos: never[]; objetivosActivosTotal: number; }; }) => {
      this.objetivosActivos = res.data.objetivosActivos;
      this.objetivosActivosTotal = res.data.objetivosActivosTotal;

      this.objetivosActivosTitle ="Objetivos"
//      this.webSite = res.visitData.slice(0, 10);
//      this.salesData = res.salesData;
//      this.offlineChartData = res.offlineChartData;
      this.cdr.detectChanges();
    });

    this.http.get('/api/init/stats/clientesactivos').subscribe((res: { data: { clientesActivos: never[]; clientesActivosTotal: number; }; }) => {
      this.clientesActivos = res.data.clientesActivos;
      this.clientesActivosTotal = res.data.clientesActivosTotal;
      this.clientesActivosTitle ="Clientes"
//      this.webSite = res.visitData.slice(0, 10);
//      this.salesData = res.salesData;
//      this.offlineChartData = res.offlineChartData;
      this.cdr.detectChanges();
    });


    const stmactual = new Date()
    const mes = stmactual.getMonth()    
    const anio = stmactual.getFullYear()    
    this.http.get(`/api/init/stats/objetivossinasistencia/${anio}/${mes}`).subscribe((res: { data: { objetivosSinAsistencia: never[]; objetivosSinAsistenciaTotal: number; }; }) => {
      this.objetivosSinAsistencia = res.data.objetivosSinAsistencia;
      this.objetivosSinAsistenciaTotal = res.data.objetivosSinAsistenciaTotal;
      this.objetivosSinAsistenciaTitle =`${anio}/${mes} Objetivos sin asistencia `
//      this.webSite = res.visitData.slice(0, 10);
//      this.salesData = res.salesData;
//      this.offlineChartData = res.offlineChartData;
      this.cdr.detectChanges();
    });

    const stmactualcur = new Date()
    const mescur = stmactualcur.getMonth()+1    
    const aniocur = stmactualcur.getFullYear()    
    this.http.get(`/api/init/stats/objetivossinasistencia/${aniocur}/${mescur}`).subscribe((res: { data: { objetivosSinAsistencia: never[]; objetivosSinAsistenciaTotal: number; }; }) => {
      this.objetivosSinAsistenciaCur = res.data.objetivosSinAsistencia;
      this.objetivosSinAsistenciaTotalCur = res.data.objetivosSinAsistenciaTotal;
      this.objetivosSinAsistenciaTitleCur =`${aniocur}/${mescur} Objetivos sin asistencia `
//      this.webSite = res.visitData.slice(0, 10);
//      this.salesData = res.salesData;
//      this.offlineChartData = res.offlineChartData;
      this.cdr.detectChanges();
    });

    




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
