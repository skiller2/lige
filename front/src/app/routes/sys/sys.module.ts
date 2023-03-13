import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { SysRoutingModule } from './sys-routing.module';
import { SysLogComponent } from './log/log.component';
import { SysLogViewComponent } from './log/view/view.component';

const COMPONENTS: Type<void>[] = [
  SysLogComponent,
  SysLogViewComponent];

@NgModule({
  imports: [
    SharedModule,
    SysRoutingModule
  ],
  declarations: COMPONENTS,
})
export class SysModule { }
