import { Component, ElementRef, NgZone, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NavigationEnd, NavigationError, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { ServiceWorkerModule, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TitleService, VERSION as VERSION_ALAIN, stepPreloader } from '@delon/theme';
import { environment } from '@env/environment';
import { NzModalService } from 'ng-zorro-antd/modal';
import { VERSION as VERSION_ZORRO } from 'ng-zorro-antd/version';
import { filter, interval, map } from 'rxjs';
import { Platform } from '@angular/cdk/platform';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SwUpdatesService } from './services/sw-updates.service';

import { SHARED_IMPORTS } from '@shared';

@Component({
    selector: 'app-root',
    template: `

<ng-template #tplpwa>
  @if (modalVersion) {
    <div class="w-100 position-absolute top-0">
      <div class="alert alert-secondary m-2">
        <button nz-button nzType="primary"  (click)="closeVersion()"></button>
        {{ 'A new version of this app is available.' | i18n }} <a href="" (click)="updateVersion()" >{{ 'Update now' | i18n}}</a>
      </div>
    </div>
  }

  @if (modalPwaPlatform === 'ANDROID' || modalPwaPlatform === 'IOS') {
    <div class="">
      <!-- Android -->
      @if (modalPwaPlatform === 'ANDROID') {
        <button nz-button nzType="primary" (click)="addToHomeScreen()">{{ 'Add this WEB app to home screen' | i18n }}</button>
      }
      <!-- iOS with Safari -->
      @if (modalPwaPlatform === 'IOS') {
        <div >
          {{ 'To install this WEB app on your device, tap the "Menu" button' | i18n }}
          <img src="https://res.cloudinary.com/rodrigokamada/image/upload/v1641089482/Blog/angular-pwa/safari_action_button_38x50.png" class="ios-menu m-0" />
          {{ 'and then "Add to home screen" button' | i18n }}
          <i class="bi bi-plus-square"></i>
        </div>
      }
    </div>
  }
</ng-template>
<router-outlet></router-outlet>


`,
    imports: [RouterOutlet, ...SHARED_IMPORTS]
})
export class AppComponent implements OnInit {

  private donePreloader = stepPreloader();

  isOnline: boolean;
  modalVersion: boolean;
  modalPwaEvent: any;
  modalPwaPlatform: string | undefined;
  @ViewChild('tplpwa', { static: true })
  tplpwa!: TemplateRef<{}>;

  constructor(
    el: ElementRef,
    renderer: Renderer2,
    private router: Router,
    private titleSrv: TitleService,
    private modalSrv: NzModalService,
//    private swUpdate: SwUpdate,
    private platform: Platform,
    private ngZone: NgZone,
    private notification: NzNotificationService,
    private swUpdatesService: SwUpdatesService
  ) {
    this.isOnline = false;
    this.modalVersion = false;
    renderer.setAttribute(el.nativeElement, 'ng-alain-version', VERSION_ALAIN.full);
    renderer.setAttribute(el.nativeElement, 'ng-zorro-version', VERSION_ZORRO.full);

  }

  private updateOnlineStatus(): void {
    this.isOnline = window.navigator.onLine;
    console.info(`isOnline=[${this.isOnline}]`);
  }

  public updateVersion(): void {
    this.modalVersion = false;
    window.location.reload();
  }

  public closeVersion(): void {
    this.modalVersion = false;
  }

  private async loadModalPwa(): Promise<void> {
    if ("getInstalledRelatedApps" in navigator) {

      // then... you can call navigator.getInstalledRelatedApps()
      const fun: any = navigator['getInstalledRelatedApps'];

      const listOfInstalledApps = await fun.call(navigator).then((relatedApps: any) => {
        console.log('relatedApps', relatedApps)

        relatedApps.forEach((app: any) => {
          console.log('platform:', app.platform);
          console.log('url:', app.url);
          console.log('id:', app.id);
          // This field is provided by the UA.
          console.log('version:', app.version);
        });
      })


      //      console.log("getInstalledRelatedApps", listOfInstalledApps)
      //      const relatedApps = await navigator.
    }


    if (!('serviceWorker' in navigator)) {
      return;
    }


    if (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true)) {
      return;
    }

    if (this.platform.ANDROID) {
      this.modalPwaPlatform = 'ANDROID';
      //No es muy compatible
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault();
        this.modalPwaEvent = event;
        this.modalPwaPlatform = 'ANDROID';
      });

    }



    if (this.platform.IOS) {
      this.modalPwaPlatform = 'IOS';
    }

    if (this.modalPwaPlatform) {
      //      this.notification.template(this.tplpwa, { nzDuration: 10000, nzPauseOnHover: true })
    }

  }

  public addToHomeScreen(): void {
    this.modalPwaEvent.prompt();
  }

  ngOnInit(): void {
    this.updateOnlineStatus();

    window.addEventListener('online', this.updateOnlineStatus.bind(this));
    window.addEventListener('offline', this.updateOnlineStatus.bind(this));

    /*
    if (this.swUpdate.isEnabled) {

      this.swUpdate.versionUpdates
        .pipe(
          filter((evt: any): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map((evt: any) => {
            console.info(`currentVersion=[${evt.currentVersion} | latestVersion=[${evt.latestVersion}]`);
            this.modalVersion = true;
          }),
        )
        .subscribe()
    }
    */


    let configLoad = false;
    this.router.events.subscribe(ev => {
      if (ev instanceof RouteConfigLoadStart) {
        configLoad = true;
      }
      if (configLoad && ev instanceof NavigationError) {
        this.modalSrv.confirm({
          nzTitle: `Recordar`,
          nzContent: environment.production ? `Es posible que se haya lanzado una nueva versión de la aplicación, haga clic en Actualizar para que surta efecto.` : `No se puede cargar la ruta：${ev.url}`,
          nzCancelDisabled: false,
          nzOkText: 'OK',
          nzCancelText: 'Cancel',
          nzOnOk: () => location.reload()
        });
      }
      if (ev instanceof NavigationEnd) {
this.donePreloader();
        this.titleSrv.setTitle();
        this.modalSrv.closeAll();
      }
    });



    this.loadModalPwa();

    this.swUpdatesService.updateVersion.subscribe(value => { 
      this.modalSrv.confirm({
        nzTitle: `Recordar`,
        nzContent: `Hay una nueva versión de la aplicación, haga clic en Actualizar para que surta efecto.`,
        nzCancelDisabled: false,
        nzOkText: 'OK',
        nzCancelText: 'Cancel',
        nzOnOk: () => location.reload()
      });
     })
    
    this.swUpdatesService.enable();


  }



}
