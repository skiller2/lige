import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { TestRoutingModule } from './test-routing.module';
import { TestComponent } from './test/test.component';
import { FiltroBuilderComponent } from 'src/app/shared/filtro-builder/filtro-builder.component';

const COMPONENTS: Array<Type<void>> = [];

@NgModule({
  imports: [
    FiltroBuilderComponent,
    SharedModule,
    TestRoutingModule,
    NzResizableModule,
  ],
  declarations: COMPONENTS,
})
export class TestModule {}
