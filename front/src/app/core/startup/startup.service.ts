import { HttpClient, HttpContext } from '@angular/common/http';
import { EnvironmentProviders, Injectable, Provider, inject, provideAppInitializer } from '@angular/core';
import { Router } from '@angular/router';
import { ACLService } from '@delon/acl';
import { ALLOW_ANONYMOUS, DA_SERVICE_TOKEN, ITokenService, JWTTokenModel, TokenService } from '@delon/auth';
import { ALAIN_I18N_TOKEN, MenuService, SettingsService, TitleService } from '@delon/theme';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { Observable, zip, catchError, map, of, mergeMap } from 'rxjs';
import { I18NService } from '@core';

/**
 * Used for application startup
 * Generally used to get the basic data of the application, like: Menu Data, User Data, etc.
 */
export function provideStartup(): Array<Provider | EnvironmentProviders> {
  return [
    StartupService,
    provideAppInitializer(() => {
      const initializerFn = (
        (startupService: StartupService) => () =>
          startupService.load()
      )(inject(StartupService));
      return initializerFn();
    })
  ];
}


@Injectable()
export class StartupService {
  private menuService = inject(MenuService);
  private settingService = inject(SettingsService);
  private aclService = inject(ACLService);
  private titleService = inject(TitleService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private i18n = inject<I18NService>(ALAIN_I18N_TOKEN);
  private tokenService = inject(DA_SERVICE_TOKEN)

  load(): Observable<void> {
    const defaultLang = this.i18n.defaultLang;
    // If http request allows anonymous access, you need to add `ALLOW_ANONYMOUS`:
    // this.httpClient.get('/app', { context: new HttpContext().set(ALLOW_ANONYMOUS, true) })
    return zip(this.i18n.loadLangData(defaultLang), this.httpClient.get('./assets/app-data.json')).pipe(
//    return zip(this.i18n.loadLangData(defaultLang), this.httpClient.get('assets/app-data.json')).pipe(
      // 接收其他拦截器后产生的异常消息
      catchError(res => {
        console.warn(`StartupService.load: Network request failed`, res);
        setTimeout(() => this.router.navigateByUrl(`/exception/500`));
        return [];
      }),
      map(([langData, appData]: [Record<string, string>, NzSafeAny]) => {
        // setting language data
        this.i18n.use(defaultLang, langData);

        // 应用信息：包括站点名、描述、年份
        this.settingService.setApp(appData.app);
        // 用户信息：包括姓名、头像、邮箱地址
        this.settingService.setUser(appData.user);
        // ACL：设置权限为全量
        this.aclService.setFull(true);
        // 初始化菜单
        this.menuService.add(appData.menu);
        // 设置页面标题的后缀
        this.titleService.default = '';
        this.titleService.suffix = appData.app.name;

        try {
          const tkndec: any = this.tokenService.get(JWTTokenModel);
          if (tkndec) {
            this.settingService.setUser({ GrupoActividad:tkndec.payload.GrupoActividad, PersonalId:tkndec.payload.PersonalId, name: tkndec.payload.name, email: tkndec.payload.email, key: tkndec.payload.username, CUIT: tkndec.payload.description });
          }
        } catch (error) {}


      })
    );
  }
}
