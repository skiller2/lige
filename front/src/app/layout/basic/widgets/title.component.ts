
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  Optional,
  Renderer2
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SettingsService, MenuService, AlainI18NService, TitleService, ALAIN_I18N_TOKEN, Menu } from '@delon/theme';
import { AlainConfigService } from '@delon/util';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { Subject, merge, filter, takeUntil } from 'rxjs';

interface PageHeaderPath {
  title?: string;
  link?: string[];
}

@Component({
    selector: 'header-title',
    template: `
    @if (!breadcrumb) {
      @if (paths && paths.length > 0) {
        <nz-breadcrumb >
          @for (i of paths; track i.link) {
            <nz-breadcrumb-item >
              @if (i.link) {
                <a [routerLink]="i.link" class="fnt-size-sm">{{ i.title }}</a>
              }
              @if (!i.link) {
                <span class="fnt-size-sm">{{ i.title }}</span>
              }
            </nz-breadcrumb-item>
          }
        </nz-breadcrumb>
      }
    } @else {
      <ng-template [ngTemplateOutlet]="breadcrumb!"></ng-template>
    }
    `,
    styles: [`.fnt-size-sm { font-size: 0.8em; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NzBreadCrumbModule, RouterModule]
})
  
export class HeaderTitleComponent implements AfterViewInit, OnDestroy {
  paths: PageHeaderPath[] = []
  breadcrumb: any | null
  autoBreadcrumb: boolean = true
  recursiveBreadcrumb: boolean = false
  homeLink?: string = '/'
  homeI18n?: string
  home?: string = ''
  inited:boolean = false
  //constructor(private el: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}
  private destroy$ = new Subject<void>();

  
  constructor(private settings: SettingsService, private renderer: Renderer2, private router: Router, private menuSrv: MenuService, private titleSrv: TitleService, private cdr: ChangeDetectorRef, private configSrv: AlainConfigService, @Optional() @Inject(ALAIN_I18N_TOKEN) private i18nSrv: AlainI18NService,) { 

    merge(menuSrv.change, router.events.pipe(filter(ev => ev instanceof NavigationEnd)), i18nSrv.change)
      .pipe(
        filter(() => this.inited),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.refresh());


  }

  ngAfterViewInit(): void {
    this.refresh()
    this.inited = true;    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();    
  }

  private get menus(): Menu[] {
    this.recursiveBreadcrumb=true
    return this.menuSrv.getPathByUrl(this.router.url, this.recursiveBreadcrumb);
  }
  
  private genBreadcrumb(): void {

    if (this.breadcrumb || !this.autoBreadcrumb || this.menus.length <= 0) {
      this.paths = [];
      return;
    }

    const paths: PageHeaderPath[] = [];
    this.menus.forEach(item => {
      if (typeof item.hideInBreadcrumb !== 'undefined' && item.hideInBreadcrumb) return;
      let title = item.text;
      if (item.i18n && this.i18nSrv) title = this.i18nSrv.fanyi(item.i18n);
      paths.push({ title, link: (item.link && [item.link]) as string[] });
    });
    // add home
    if (this.home) {
      paths.splice(0, 0, {
        title: (this.homeI18n && this.i18nSrv && this.i18nSrv.fanyi(this.homeI18n)) || this.home,
        link: [this.homeLink!]
      });
    }
    this.paths = paths;
  }

  refresh(): void {
    this.genBreadcrumb();
    this.cdr.detectChanges();
  } 
}
