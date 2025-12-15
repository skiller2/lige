// 请参考：https://ng-alain.com/docs/i18n
import { Platform } from '@angular/cdk/platform';
import { registerLocaleData } from '@angular/common';
import ngEs from '@angular/common/locales/es';
import ngEn from '@angular/common/locales/en';
import ngZh from '@angular/common/locales/zh';
import ngZhTw from '@angular/common/locales/zh-Hant';
import { Injectable, inject } from '@angular/core';
import {
  DelonLocaleService,
  en_US as delonEnUS,
  es_ES as delonEsES,
  SettingsService,
  zh_CN as delonZhCn,
  zh_TW as delonZhTw,
  _HttpClient,
  AlainI18nBaseService
} from '@delon/theme';
import { AlainConfigService } from '@delon/util/config';
import { es as dfEs,  enUS as dfEn, zhCN as dfZhCn, zhTW as dfZhTw } from 'date-fns/locale';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { es_ES as zorroEsES ,en_US as zorroEnUS, NzI18nService, zh_CN as zorroZhCN, zh_TW as zorroZhTW } from 'ng-zorro-antd/i18n';
import { Observable } from 'rxjs';

interface LangConfigData {
  abbr: string;
  text: string;
  ng: NzSafeAny;
  zorro: NzSafeAny;
  date: NzSafeAny;
  delon: NzSafeAny;
}

const DEFAULT = 'es-ES';
const LANGS: Record<string, LangConfigData> = {
  'zh-CN': {
    text: '简体中文',
    ng: ngZh,
    zorro: zorroZhCN,
    date: dfZhCn,
    delon: delonZhCn,
    abbr: '🇨🇳'
  },
  'zh-TW': {
    text: '繁体中文',
    ng: ngZhTw,
    zorro: zorroZhTW,
    date: dfZhTw,
    delon: delonZhTw,
    abbr: '🇭🇰'
  },
  'en-US': {
    text: 'English',
    ng: ngEn,
    zorro: zorroEnUS,
    date: dfEn,
    delon: delonEnUS,
    abbr: '🇬🇧'
  },
  'es-ES': {
    text: 'Español',
    ng: ngEs,
    zorro: zorroEsES,
    date: dfEs,
    delon: delonEsES,
    abbr: '🇬🇧'
  }
};

@Injectable({ providedIn: 'root' })
export class I18NService extends AlainI18nBaseService {
  private readonly http = inject(_HttpClient);
  private readonly settings = inject(SettingsService);
  private readonly nzI18nService = inject(NzI18nService);
  private readonly delonLocaleService = inject(DelonLocaleService);
  private readonly platform = inject(Platform);

  protected override _defaultLang = DEFAULT;
  private _langs = Object.keys(LANGS).map(code => {
    const item = LANGS[code];
    return { code, text: item.text, abbr: item.abbr };
  });

  private _dateFormat = ""

  constructor() {
    super();
    console.log('i18n constructor')
    console.trace('i18n constructor trace')
    const defaultLang = this.getDefaultLang();
    this._defaultLang = this._langs.findIndex(w => w.code === defaultLang) === -1 ? DEFAULT : defaultLang;
  }

  private getDefaultLang(): string {
    if (!this.platform.isBrowser) {
      return DEFAULT;
    }
    if (this.settings.layout.lang) {
      return this.settings.layout.lang;
    }
    let res = (navigator.languages ? navigator.languages[0] : null) || navigator.language;
    const arr = res.split('-');
    return arr.length <= 1 ? res : `${arr[0]}-${arr[1].toUpperCase()}`;
  }

  loadLangData(lang: string): Observable<NzSafeAny> {
    return this.http.get(`./assets/tmp/i18n/${lang}.json`);
  }

  use(lang: string, data: Record<string, unknown>): void {
    if (this._currentLang === lang) return;

    this._data = this.flatData(data, []);

    const item = LANGS[lang];
    registerLocaleData(item.ng);
    this.nzI18nService.setLocale(item.zorro);
    this.nzI18nService.setDateLocale(item.date);
    this.delonLocaleService.setLocale(item.delon);
    this._currentLang = lang;
    this._change$.next(lang);
  }

  getLangs(): Array<{ code: string; text: string; abbr: string }> {
    return this._langs;
  }

  getDateFormat(): string { return this._dateFormat || 'dd/MM/yyyy' }

  private getBrowserLocaleDateFormat(): string {
    const locale = navigator.language; // Get the browser's locale
    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  
    // Format a test date to determine the locale-specific order
    const parts = formatter.formatToParts(new Date(2025, 0, 1)); // Example date: Jan 1, 2025
  
    // Construct the format based on the parts
    return parts
      .map(part => {
        if (part.type === 'year') return 'yyyy';
        if (part.type === 'month') return 'MM';
        if (part.type === 'day') return 'dd';
        return part.value; // Preserve separators like "-" or "/"
      })
      .join('');
  }
}