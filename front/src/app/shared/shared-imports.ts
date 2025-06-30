import { Type } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SHARED_DELON_MODULES } from './shared-delon.module';
import { SHARED_ZORRO_MODULES } from './shared-zorro.module';
import { CUITPipe } from './utils/cuit-pipe';
import { AGEPipe } from './utils/age-pipe';
import { ImageCropperModule } from 'ngx-image-cropper';
import { AppDownFileDirective } from './down-file/down-file.directive';
import { AngularSlickgridModule } from 'angular-slickgrid';
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
  AppFilterPipe,
  AppDownFileDirective,
  ColsFilterPipe,
  AngularSlickgridModule,
  NgxMaskDirective,
  DotToCommaDirective,
  ...SHARED_DELON_MODULES,
  ...SHARED_ZORRO_MODULES
];

















/*






// #region your componets & directives
const COMPONENTS: Array<Type<any>> = [
  PersonalSearchComponent,
  ClienteSearchComponent,
  ObjetivoSearchComponent,
  TipoMovimientoSearchComponent,
  FechaSearchComponent,
  PdfviewerComponent,
  UploadFileComponent,
  ViewCredentialComponent,
  ImageContentComponent,
  FormComponent,
  PeriodoSelectComponent,
];
const DIRECTIVES: Array<Type<any>> = [CUITPipe, AppFilterPipe,AppDownFileDirective,ColsFilterPipe];
// #endregion

@NgModule({

  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    AlainThemeModule.forChild(),
    DelonACLModule,
    DelonFormModule,
    AngularSlickgridModule,

    ...SHARED_DELON_MODULES,
    ...SHARED_ZORRO_MODULES,
    // third libs
    ...THIRDMODULES,
  ],
  declarations: [
    // your components
    ...COMPONENTS,
    ...DIRECTIVES,
//    RowDetailViewComponent,
//    RowPreloadDetailComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AlainThemeModule,
    DelonACLModule,
    DelonFormModule,
    
    ...SHARED_DELON_MODULES,
    ...SHARED_ZORRO_MODULES,
    // third libs
    ...THIRDMODULES,
    // your components
    ...COMPONENTS,
    ...DIRECTIVES,
  ],
})
export class SharedModule {}
*/