import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { GesRoutingModule } from './ges-routing.module';
import { GesCcfarmComponent } from './ccfarm/ccfarm.component';

const COMPONENTS: Type<void>[] = [
  GesCcfarmComponent];

@NgModule({
  imports: [
    SharedModule,
    GesRoutingModule
  ],
  declarations: COMPONENTS,
})
export class GesModule { }
