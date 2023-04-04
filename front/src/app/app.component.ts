import { Component, ElementRef, NgZone, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, NavigationError, RouteConfigLoadStart, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TitleService, VERSION as VERSION_ALAIN } from '@delon/theme';
import { environment } from '@env/environment';
import { NzModalService } from 'ng-zorro-antd/modal';
import { VERSION as VERSION_ZORRO } from 'ng-zorro-antd/version';
import { filter, interval, map } from 'rxjs';
import { Platform } from '@angular/cdk/platform';


@Component({
  selector: 'app-root',
  template: `
<div class="w-100 position-absolute top-0" *ngIf="modalVersion">
  <div class="alert alert-secondary m-2">
    <button type="button" class="btn-close position-absolute top-0 end-0 m-1" aria-label="Close" (click)="closeVersion()"></button>
    {{ 'A new version of this app is available.' | i18n }} <a href="" (click)="updateVersion()" >{{ 'Update now' | i18n}}</a>
  </div>
</div>


<div class="w-100 position-absolute bottom-0" *ngIf="modalPwaPlatform === 'ANDROID' || modalPwaPlatform === 'IOS'">
  <div class="alert alert-secondary m-2">
    <button type="button" class="btn-close position-absolute top-0 end-0 m-1" aria-label="Close" (click)="closePwa()"></button>
    <!-- Android -->
    <div *ngIf="modalPwaPlatform === 'ANDROID'" (click)="addToHomeScreen()" >
      {{ 'Add this WEB app to home screen' | i18n }} 
    </div>
    <!-- iOS with Safari -->
    <div *ngIf="modalPwaPlatform === 'IOS'" >
      {{ 'To install this WEB app on your device, tap the "Menu" button' | i18n }}
      <img src="https://res.cloudinary.com/rodrigokamada/image/upload/v1641089482/Blog/angular-pwa/safari_action_button_38x50.png" class="ios-menu m-0" />
      {{ 'and then "Add to home screen" button' | i18n }}
      <i class="bi bi-plus-square"></i>
    </div>
  </div>
</div>

<router-outlet></router-outlet> 


`
})
export class AppComponent implements OnInit {

  isOnline: boolean;
  modalVersion: boolean;
  modalPwaEvent: any;
  modalPwaPlatform: string | undefined;

  constructor(
    el: ElementRef,
    renderer: Renderer2,
    private router: Router,
    private titleSrv: TitleService,
    private modalSrv: NzModalService,
    private swUpdate: SwUpdate,
    private platform: Platform,
    private ngZone: NgZone    
  ) {
    this.isOnline = false;
    this.modalVersion = false;
    renderer.setAttribute(el.nativeElement, 'ng-alain-version', VERSION_ALAIN.full);
    renderer.setAttribute(el.nativeElement, 'ng-zorro-version', VERSION_ZORRO.full);

    if (this.swUpdate.isEnabled) {

      this.ngZone.runOutsideAngular(() =>
        interval(1000 * 10).subscribe(val => {
          this.swUpdate
            .checkForUpdate()
            .then(_ => console.log('SW Checking for updates'));
        })
      );
    }

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

  private loadModalPwa(): void {
    if (this.platform.ANDROID) {
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault();
        this.modalPwaEvent = event;
        this.modalPwaPlatform = 'ANDROID';
      });
    }

    if (this.platform.IOS && this.platform.SAFARI) {
      const isInStandaloneMode = ('standalone' in window.navigator) && ((<any>window.navigator)['standalone']);
      if (!isInStandaloneMode) {
        this.modalPwaPlatform = 'IOS';
      }
    }
  }

  public addToHomeScreen(): void {
    this.modalPwaEvent.prompt();
    this.modalPwaPlatform = undefined;
  }

  public closePwa(): void {
    this.modalPwaPlatform = undefined;
  }

  ngOnInit(): void {
    console.log('Platform', this.platform)
    this.updateOnlineStatus();

    window.addEventListener('online', this.updateOnlineStatus.bind(this));
    window.addEventListener('offline', this.updateOnlineStatus.bind(this));

    if (this.swUpdate.isEnabled) {

      this.swUpdate.versionUpdates.pipe(
        filter((evt: any): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map((evt: any) => {
          console.info(`currentVersion=[${evt.currentVersion} | latestVersion=[${evt.latestVersion}]`);
          this.modalVersion = true;
        }),
      );
    }


    let configLoad = false;
    this.router.events.subscribe(ev => {
      if (ev instanceof RouteConfigLoadStart) {
        configLoad = true;
      }
      if (configLoad && ev instanceof NavigationError) {
        this.modalSrv.confirm({
          nzTitle: `提醒`,
          nzContent: environment.production ? `应用可能已发布新版本，请点击刷新才能生效。` : `无法加载路由：${ev.url}`,
          nzCancelDisabled: false,
          nzOkText: '刷新',
          nzCancelText: '忽略',
          nzOnOk: () => location.reload()
        });
      }
      if (ev instanceof NavigationEnd) {
        this.titleSrv.setTitle();
        this.modalSrv.closeAll();
      }
    });


    this.loadModalPwa();

  }
}
