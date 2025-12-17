import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { default as ngLang } from '@angular/common/locales/zh';
import { ApplicationConfig, DEFAULT_CURRENCY_CODE, EnvironmentProviders, Provider, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withHashLocation, RouterFeatures, withViewTransitions } from '@angular/router';
import { I18NService, defaultInterceptor, provideBindAuthRefresh, provideStartup } from '@core';
import { provideCellWidgets } from '@delon/abc/cell';
import { provideSTWidgets } from '@delon/abc/st';
import { authSimpleInterceptor, provideAuth } from '@delon/auth';
import { provideSFConfig } from '@delon/form';
import { AlainProvideLang, provideAlain, zh_CN as delonLang } from '@delon/theme';
import { AlainConfig } from '@delon/util/config';
import { environment } from '@env/environment';
import { CELL_WIDGETS, SF_WIDGETS, ST_WIDGETS } from '@shared';
import { zhCN as dateLang } from 'date-fns/locale';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { zh_CN as zorroLang } from 'ng-zorro-antd/i18n';

import { routes } from './routes/routes';
import { ICONS } from '../style-icons';
import { ICONS_AUTO } from '../style-icons-auto';
import { AngularSlickgridModule } from 'angular-slickgrid';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NgxMaskOptions, provideEnvironmentNgxMask } from 'ngx-mask';
import { decimalMarkerFactory, DEFAULT_DECIMAL_MARKER, DEFAULT_THOUSAND_SEPARATOR, thousandSeparatorFactory } from './app.config.defaults';

const defaultLang: AlainProvideLang = {
  abbr: 'es-AR',
  ng: ngLang,
  zorro: zorroLang,
  date: dateLang,
  delon: delonLang
};

const alainConfig: AlainConfig = {
  st: { modal: { size: 'lg' } },
  pageHeader: { homeI18n: 'home' },
  lodop: {
    license: `A59B099A586B3851E0F0D7FDBF37B603`,
    licenseA: `C94CEE276DB2187AE6B65D56B3FC2848`
  },
  auth: { login_url: '/passport/login' }
};

export const maskConfigFactory = (): NgxMaskOptions => ({
 thousandSeparator: thousandSeparatorFactory(),
 decimalMarker: decimalMarkerFactory() as '.'|',',
 leadZero: true,
});

const ngZorroConfig: NzConfig = {
};

const routerFeatures: RouterFeatures[] = [
  withComponentInputBinding(), 
  withViewTransitions({
    onViewTransitionCreated: ({ transition, to, from }) => {
      // Solo permitir transiciones cuando el documento esté visible
      if (document.hidden) {
        transition.skipTransition();
      }
    }
  }), 
  withInMemoryScrolling({ scrollPositionRestoration: 'top' })
];
if (environment.useHash) routerFeatures.push(withHashLocation());

const providers: Array<Provider | EnvironmentProviders> = [
  provideHttpClient(withInterceptors([...(environment.interceptorFns ?? []), authSimpleInterceptor, defaultInterceptor])),
  provideAnimations(),
  provideRouter(routes, ...routerFeatures),
  provideAlain({ config: alainConfig, defaultLang, i18nClass: I18NService, icons: [...ICONS_AUTO, ...ICONS] }),
  
  provideNzConfig(ngZorroConfig),
  provideAuth(),
  provideCellWidgets(...CELL_WIDGETS),
  provideSTWidgets(...ST_WIDGETS),
  provideSFConfig({ widgets: SF_WIDGETS }),
  provideStartup(),

  

  importProvidersFrom(AngularSlickgridModule.forRoot()),


  importProvidersFrom(
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    })
  ),
  { provide: DEFAULT_CURRENCY_CODE, useValue: '$' },
  { provide: DATE_PIPE_DEFAULT_OPTIONS, useFactory: (i18n: I18NService) => ({ dateFormat: i18n.getDateFormat() }), deps: [I18NService] },
  { provide: DEFAULT_THOUSAND_SEPARATOR, useFactory: thousandSeparatorFactory },
  { provide: DEFAULT_DECIMAL_MARKER, useFactory: decimalMarkerFactory },

//  { provide: NZ_CONFIG, useFactory: (i18n: I18NService) => ({ datePicker: { nzFormat: i18n.getDateFormat(), // Set the global default format here
//      },    }), deps: [I18NService] },
  provideEnvironmentNgxMask(maskConfigFactory),
  ...(environment.providers || [])
];

// If you use `@delon/auth` to refresh the token, additional registration `provideBindAuthRefresh` is required
if (environment.api?.refreshTokenEnabled && environment.api.refreshTokenType === 'auth-refresh') {
  providers.push(provideBindAuthRefresh());
}

export const appConfig: ApplicationConfig = {
  providers: providers
};
