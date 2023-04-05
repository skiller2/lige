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
import { QRModule } from '@delon/abc/qr';
import { CredPersComponent } from './credpers/credpers.component';
import { ExcepcionAsistenciaComponent } from './asisexcept/asistenciaexcepcion.component';

const COMPONENTS: Array<Type<void>> = [ExcepcionAsistenciaComponent, GesCcfarmComponent, ImgPersComponent,CredPersComponent, FormComponent, ImageContentComponent,ViewCredentialComponent,CUITPipe];

@NgModule({
imports: [SharedModule, GesRoutingModule, NzResizableModule, ImageCropperModule,QRModule],
  declarations: COMPONENTS
})
export class GesModule {}
