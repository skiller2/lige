import { NgModule, Type } from '@angular/core';
import { SharedModule } from '@shared';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { TestRoutingModule } from './test-routing.module';
import { TestComponent } from './test/test.component';


const COMPONENTS: Array<Type<void>> = [TestComponent
];

@NgModule({
  imports: [
    SharedModule,
    TestRoutingModule,
    NzResizableModule,
  ],
  declarations: COMPONENTS,
})
export class TestModule {}
