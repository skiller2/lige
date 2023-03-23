import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { NzResizableModule } from 'ng-zorro-antd/resizable';

import { GesCcfarmComponent } from './ccfarm/ccfarm.component';
import { ImgPersComponent } from './imgpers/imgpers.component';
import { GesRoutingModule } from './ges-routing.module';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';
import { ImageContentComponent } from 'src/app/shared/imagePreview/image-content/image-content.component';
import { ViewCredentialComponent} from 'src/app/shared/viewCredential/view-credential.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { CUITPipe } from 'src/app/shared/utils/cuit-pipe';

const COMPONENTS: Array<Type<void>> = [GesCcfarmComponent, ImgPersComponent, FormComponent, ImageContentComponent,ViewCredentialComponent,CUITPipe];

@NgModule({
imports: [SharedModule, GesRoutingModule, NzResizableModule, ImageCropperModule],
  declarations: COMPONENTS
})
export class GesModule {}
