import { CommonModule } from '@angular/common';
import { NgModule, Type } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DelonACLModule } from '@delon/acl';
import { DelonFormModule } from '@delon/form';
import { AlainThemeModule } from '@delon/theme';

import { SHARED_DELON_MODULES } from './shared-delon.module';
import { SHARED_ZORRO_MODULES } from './shared-zorro.module';
import { PdfviewerComponent } from './pdfviewer/pdfviewer.component';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { PersonalSearchComponent } from './personal-search/personal-search.component';
import { ClienteSearchComponent } from './cliente-search/cliente-search.component';
import { PeriodoSelectComponent } from './periodo-select/periodo-select.component';
import { CUITPipe } from './utils/cuit-pipe';
import { ImageContentComponent } from './imagePreview/image-content/image-content.component';
import { FormComponent } from './imagePreview/form/form.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { QRModule } from '@delon/abc/qr';
import { ViewCredentialComponent } from './viewCredential/view-credential.component';
import { AppFilterPipe,ColsFilterPipe } from './utils/filter-type';
import { ObjetivoSearchComponent } from './objetivo-search/objetivo-search.component';
import { AppDownFileDirective } from './down-file/down-file.directive';
import { AngularSlickgridModule } from 'angular-slickgrid';
//import { RowDetailViewComponent } from './row-detail-view/row-detail-view.component';
//import { RowPreloadDetailComponent } from './row-preload-detail/row-preload-detail.component';

// #region third libs
// import { NgxTinymceModule } from 'ngx-tinymce';

const THIRDMODULES: Array<Type<any>> = [ImageCropperModule, QRModule,AngularSlickgridModule,];
// #endregion

export type listOptionsT = {
  filtros: any[],
  sort: any,
}


// #region your componets & directives
const COMPONENTS: Array<Type<any>> = [
  PersonalSearchComponent,
  ClienteSearchComponent,
  ObjetivoSearchComponent,
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
