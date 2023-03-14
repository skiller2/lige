import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { NzResizableModule } from 'ng-zorro-antd/resizable';

import { GesCcfarmComponent } from './ccfarm/ccfarm.component';
import { GesRoutingModule } from './ges-routing.module';

const COMPONENTS: Array<Type<void>> = [GesCcfarmComponent];

@NgModule({
  imports: [SharedModule, GesRoutingModule, NzResizableModule],
  declarations: COMPONENTS
})
export class GesModule {}
