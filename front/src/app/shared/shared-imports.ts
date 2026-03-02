import { Type } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SHARED_DELON_MODULES } from './shared-delon.module';
import { SHARED_ZORRO_MODULES } from './shared-zorro.module';
import { CUITPipe } from './utils/cuit-pipe';
import { AGEPipe } from './utils/age-pipe';
import { ImageCropperModule } from 'ngx-image-cropper';
import { AppDownFileDirective } from './down-file/down-file.directive';
import { AngularSlickgridModule } from 'angular-slickgrid';
import { AngularSlickgridComponent, GridOption } from 'angular-slickgrid';
//import { RowDetailViewComponent } from './row-detail-view/row-detail-view.component';
//import { RowPreloadDetailComponent } from './row-preload-detail/row-preload-detail.component';

import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe, I18nPipe } from '@delon/theme';
import { AppFilterPipe } from './utils/filter-type';
import { ColsFilterPipe } from './utils/cols-pipe';
import { UrlAuthPipe } from './utils/url-auth-pipe';
import { NgxMaskDirective } from 'ngx-mask';
import { DotToCommaDirective } from './dot-coma/dot-coma';
import { I18NCurrencyPipe } from './utils/i18n-currency.pipe';

// #region third libs
// import { NgxTinymceModule } from 'ngx-tinymce';

const THIRDMODULES: Array<Type<any>> = [ImageCropperModule, AngularSlickgridModule,];
// #endregion

export type listOptionsT = {
  filtros: any[],
  sort: any,
}





export const SHARED_IMPORTS = [
  FormsModule,
  ReactiveFormsModule,
  RouterLink,
  NgTemplateOutlet,
  NgClass,
  NgStyle,
  I18nPipe,
  DatePipe,
  CUITPipe,
  UrlAuthPipe,
  AGEPipe,
  I18NCurrencyPipe,
  AppFilterPipe,
  AppDownFileDirective,
  ColsFilterPipe,
  AngularSlickgridModule,
  NgxMaskDirective,
  DotToCommaDirective,
  ...SHARED_DELON_MODULES,
  ...SHARED_ZORRO_MODULES
];

