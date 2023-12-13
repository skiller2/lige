import { NgModule, Type } from '@angular/core';
import { G2MiniAreaModule } from '@delon/chart/mini-area';
import { G2MiniBarModule } from '@delon/chart/mini-bar';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';

import { WidgetsRoutingModule } from './widgets-routing.module';
import { WidgetsComponent } from './widgets/widgets.component';
import { AppDownFileDirective, SHARED_IMPORTS } from '@shared';

const COMPONENTS: Array<Type<void>> = [];

@NgModule({
  imports: [...SHARED_IMPORTS, WidgetsRoutingModule, NzCarouselModule, G2MiniBarModule, G2MiniAreaModule,WidgetsComponent,AppDownFileDirective],
  declarations: COMPONENTS
})
export class WidgetsModule {}
