import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { NzResizableModule } from 'ng-zorro-antd/resizable';

import { GesCcfarmComponent } from './ccfarm/ccfarm.component';
import { ImgPersComponent } from './imgpers/imgpers.component';
import { GesRoutingModule } from './ges-routing.module';
import { FormComponent } from 'src/app/shared/imagePreview/form/form.component';
import { ImageCanvasComponent } from 'src/app/shared/imagePreview/image-canvas/image-canvas.component';
import { ContentSelectorComponent } from 'src/app/shared/imagePreview/content-selector/content-selector.component';

const COMPONENTS: Array<Type<void>> = [GesCcfarmComponent, ImgPersComponent, FormComponent, ImageCanvasComponent, ContentSelectorComponent];

@NgModule({
  imports: [SharedModule, GesRoutingModule, NzResizableModule],
  declarations: COMPONENTS
})
export class GesModule {}
